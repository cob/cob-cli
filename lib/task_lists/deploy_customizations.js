require('colors');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');
const axios = require('axios');
const tough = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support');
const FileCookieStore = require('file-cookie-store');
const { promptCredentials } = require("./common_helpers");

const CUSTOMIZATIONS_FILE = "customizations.json";

// Server that keeps the inventory of which customization versions each server repo uses.
// It only ever receives { repo, customization: version }: it has no access to the repos.
const INVENTORY_URL = (process.env.COB_CLI_INVENTORY_URL || "https://dogfooding.cultofbits.com").replace(/\/+$/, "");
const INVENTORY_CONCURRENT = "/integrationm/concurrent/GithubCustomizationsVersions";

/* ************************************ */
// Throws if text isn't a { "customization": "version" } JSON object. Used wherever a wrong file
// must not be mistaken for "no customizations": registering that would wipe the inventory.
function _parseStrict(text, what) {
    let versions;
    try {
        versions = JSON.parse(text);
    } catch (err) {
        throw new Error(`${what} is not valid JSON: ${err.message}`);
    }
    if (!versions || typeof versions != "object" || Array.isArray(versions)) {
        throw new Error(`${what} should be a JSON object like {"customization": "version"}`);
    }
    return versions;
}

/* ************************************ */
// Only for what was in the last deploy, which is just a reference to compare with:
// if it's unusable, it's the same as if there was nothing there.
function _parseLenient(text) {
    try {
        return _parseStrict(text, CUSTOMIZATIONS_FILE);
    } catch {
        return {};
    }
}

/* ************************************ */
function sameVersions(a, b) {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    return keysA.length == keysB.length && keysA.every((k, i) => k == keysB[i] && a[k] == b[k]);
}

/* ************************************ */
// Compares customizations.json now with what it was in the last deploy to this server.
// Must be called before the deploy registers the new lastDeploySha.
// Throws if the current customizations.json is invalid (see _parseStrict).
async function getCustomizationsChange(lastSha) {
    const current = fs.existsSync(CUSTOMIZATIONS_FILE) ? _parseStrict(fs.readFileSync(CUSTOMIZATIONS_FILE, "utf8"), CUSTOMIZATIONS_FILE) : {};

    let previous = {};
    if (lastSha) {
        try {
            await git().raw(["cat-file", "-e", lastSha + "^{commit}"]);
        } catch {
            // last deployed commit is not in this clone: we can't tell, so assume it changed
            return { current, changed: Object.keys(current).length > 0 };
        }
        try {
            previous = _parseLenient(await git().raw(["show", lastSha + ":" + CUSTOMIZATIONS_FILE]));
        } catch {
            previous = {}; // the file didn't exist in the last deploy
        }
    }
    return { current, changed: !sameVersions(previous, current) };
}

/* ************************************ */
// What is in use in production is what was in the last deployed commit, not what is in the working
// copy (which may be on another branch, ahead of what was deployed). Throws if it can't be known.
async function getDeployedCustomizations(lastSha) {
    if (!lastSha) throw new Error("no previous deploy found on the server");
    try {
        await git().raw(["cat-file", "-e", lastSha + "^{commit}"]);
    } catch {
        throw new Error(`the last deployed commit (${lastSha}) is not in this clone, try ${"git fetch".bold.blue} first`);
    }
    let text;
    try {
        text = await git().raw(["show", lastSha + ":" + CUSTOMIZATIONS_FILE]);
    } catch {
        throw new Error(`${CUSTOMIZATIONS_FILE} doesn't exist in the last deployed commit (${lastSha}), nothing to register`);
    }
    return _parseStrict(text, `${CUSTOMIZATIONS_FILE} in the last deployed commit (${lastSha})`);
}

/* ************************************ */
async function _getRepoName() {
    try {
        const url = (await git().raw(["remote", "get-url", "origin"])).trim();
        const name = url.replace(/\/+$/, "").replace(/\.git$/, "").split(/[\/:]/).pop();
        if (name) return name;
    } catch { }
    return path.basename(process.cwd());
}

/* ************************************ */
// Same authentication as updateFromServer and tagDefs: --cookie <file> or username/password prompt
async function _authenticate(args) {
    const jar = new tough.CookieJar();
    const client = axiosCookieJarSupport.wrapper(axios.create({ jar: jar, withCredentials: true, timeout: 60000 }));

    if (args.cookie) {
        const p = path.resolve(args.cookie);
        const cookieFile = new FileCookieStore(p, { auto_sync: false, force_parse: true });
        const host = new URL(INVENTORY_URL).hostname;
        const c = await new Promise((resolve, reject) => {
            cookieFile.findCookie(host, '/', 'cobtoken', (err, result) => err != null ? reject(err) : resolve(result));
        });
        if (!c) throw new Error(`no cobtoken cookie for ${host} in ${p}; the inventory is on ${host}, so it has to be a cookie of that server, not of the one being deployed`);
        jar.setCookieSync(c.toString(), INVENTORY_URL);
        return client;
    }

    if (!process.stdin.isTTY) return null;

    const credentials = await promptCredentials();
    if (!credentials.username) return null;

    await client.post(INVENTORY_URL + "/recordm/security/auth", credentials, {
        headers: { "Content-Type": "application/json" },
    });
    return client;
}

/* ************************************ */
// Retrying doesn't need a deploy (nor --force, which skips the safety checks): it just registers again
// what the last deploy left on the server.
function retryCommand(args) {
    return "cob-cli deploy --customizationsInventoryOnly" + (args.servername ? " -s " + args.servername : "");
}

/* ************************************ */
// Never throws: the deploy is already done, failing to register must not look like a failed deploy.
// Returns whether the versions ended up registered.
async function registerCustomizations(cmdEnv, args, customizations) {
    const host = new URL(INVENTORY_URL).hostname;
    const retryTip = " Retry with " + retryCommand(args).bold.blue + ".";
    try {
        console.log("Registering customization versions in " + host.bold.blue + (args.cookie ? "" : " (empty username to skip)") + "...");

        const client = await _authenticate(args);
        if (!client) {
            console.log("Skipped:".yellow + " customization versions not registered." + retryTip);
            return false;
        }

        const response = await client.post(INVENTORY_URL + INVENTORY_CONCURRENT, {
            registerRepoCustomizations: true,
            repository: await _getRepoName(),
            servername: cmdEnv.servername,
            environment: cmdEnv.name,
            customizations: customizations,
        }, { headers: { "Content-Type": "application/json" } });

        // A 200 isn't enough: e.g. a login page or a proxy answering in place of the concurrent
        // would otherwise be reported as "Registered: 0 new, 0 unchanged, 0 removed".
        const result = response.data;
        const isReport = result && typeof result == "object" && !Array.isArray(result)
            && ["installed", "kept", "removed", "unknown"].some(k => Array.isArray(result[k]));
        if (!isReport) throw new Error("unexpected response from the inventory (not the registration report)");

        const count = (list) => (list || []).length;
        console.log("Registered:".green
            + ` ${count(result.installed)} new, ${count(result.kept)} unchanged, ${count(result.removed)} removed.`);
        if (count(result.unknown)) console.log("Warning:".yellow + " not in the inventory (no such customization or version): " + result.unknown.join(", "));
        return true;

    } catch (err) {
        const status = err.response && err.response.status;
        const detail = err.response && err.response.data ? " " + JSON.stringify(err.response.data).slice(0, 300) : "";
        const reason = status == 401 || status == 403 ? "authentication failed" : (status ? "HTTP " + status + detail : err.message);
        console.log("Warning:".yellow + " customization versions not registered in " + host + " (" + reason + ")." + retryTip);
        return false;
    }
}

module.exports = {
    getCustomizationsChange: getCustomizationsChange,
    getDeployedCustomizations: getDeployedCustomizations,
    registerCustomizations: registerCustomizations,
    sameVersions: sameVersions,
};
