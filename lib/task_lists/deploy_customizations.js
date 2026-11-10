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
function _parse(text) {
    try {
        const versions = JSON.parse(text);
        return (versions && typeof versions == "object" && !Array.isArray(versions)) ? versions : {};
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
async function getCustomizationsChange(lastSha) {
    const current = fs.existsSync(CUSTOMIZATIONS_FILE) ? _parse(fs.readFileSync(CUSTOMIZATIONS_FILE, "utf8")) : {};

    let previous = {};
    if (lastSha) {
        try {
            await git().raw(["cat-file", "-e", lastSha + "^{commit}"]);
        } catch {
            // last deployed commit is not in this clone: we can't tell, so assume it changed
            return { current, changed: Object.keys(current).length > 0 };
        }
        try {
            previous = _parse(await git().raw(["show", lastSha + ":" + CUSTOMIZATIONS_FILE]));
        } catch {
            previous = {}; // the file didn't exist in the last deploy
        }
    }
    return { current, changed: !sameVersions(previous, current) };
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
        if (!c) throw new Error(`couldn't find a cookie for ${host} in ${p}`);
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
// Never throws: the deploy is already done, failing to register must not look like a failed deploy.
async function registerCustomizations(cmdEnv, args, customizations) {
    const host = new URL(INVENTORY_URL).hostname;
    const retryTip = " Retry with " + "cob-cli deploy --force".bold.blue + ".";
    try {
        console.log("\nCustomization versions changed since last deploy. Registering them in " + host.bold.blue + (args.cookie ? "" : " (empty username to skip)") + "...");

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

        const result = response.data || {};
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
    registerCustomizations: registerCustomizations,
    sameVersions: sameVersions,
};
