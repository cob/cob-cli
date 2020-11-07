const execa = require('execa');
const fs = require('fs-extra');
const git = require('simple-git/promise');
const { SERVER_COB_CLI_DIRECTORY } = require("./common_helpers");

const CHANGELOGFILE = "CHANGELOG.md";
const LAST_SHA_FILE = "lastDeploySha"
const SERVER_LAST_SHA_FILE = SERVER_COB_CLI_DIRECTORY + LAST_SHA_FILE;

/* ************************************ */

async function getLastDeployedSha(server) {
    let result = await execa('ssh', [server, "cat " + SERVER_LAST_SHA_FILE + " || echo '' "]);
    return result.stdout;
}
exports.getLastDeployedSha = getLastDeployedSha;

/* ************************************ */
function setLastDeployedSha(server, lastSha) {
    execa('ssh', [server, "echo '" + lastSha + "' > " + SERVER_LAST_SHA_FILE]);
}

/* ************************************ */
function getCurrentBranch() {
    return git().revparse(["--abbrev-ref", "HEAD"]);
}
exports.getCurrentBranch = getCurrentBranch;

/* ************************************ */
function getCurrentSha() {
    return git().revparse(["--short", "HEAD"]);
}

/* ************************************ */
function releaseSignature(branch, sha, server) {
    return `Deploy branch:${branch} (${sha}) to ${server}`;
}

/* ************************************ */
async function registerRelease(server) {
    let diffs = "";
    let currentSha = await getCurrentSha();
    let lastSha = await getLastDeployedSha(server);

    if (!lastSha) {
        diffs = "\n * First deploy";
    } else {
        if (lastSha != currentSha) { // Only if diferent SHA, otherwise wont do anything, it's a re-deploy
            let gitLog = (await git().log([lastSha + ".." + currentSha]).then(result => result));
            if (gitLog.all.length) {
                for (let i = 0; i < gitLog.all.length; i++) {
                    if (gitLog.all[i].message.match(new RegExp(releaseSignature(".*", ".*", ".*") + "$"))) {
                        // Don't include deploy lines in diffs
                        continue;
                    }
                    diffs = diffs
                        + "\n * "
                        + gitLog.all[i].date
                        + ": "
                        + gitLog.all[i].message;
                }
            }
        }
    }

    if (diffs) {
        const currentBranch = await getCurrentBranch();
        const user = require('whoami');
        const date = new Date();
        const newDeployText = releaseSignature(currentBranch, currentSha, server) + "\n"
            + `\n Deployed by ${user}`
            + `\n ${date}\n`;

        var originalChangeLog = "";
        try {
            originalChangeLog = fs.readFileSync(CHANGELOGFILE).toString(); //TODO: consider getting file from server instead
        } catch (e) {
            // we're assuming error means non-existing file, so procedd with default empty originalChangeLog
        }

        let newChangeLog = "# " + newDeployText + diffs + "\n\n" + originalChangeLog;
        fs.writeFile(CHANGELOGFILE, newChangeLog, function (err) {
            if (err) {
                throw new Error("\nError:".red + " Failed to write changeLog.\n");
            }
        });

        await git().add([CHANGELOGFILE]);
        await git().commit([newDeployText]);
    }
    setLastDeployedSha(server, currentSha);
}
exports.registerRelease = registerRelease;