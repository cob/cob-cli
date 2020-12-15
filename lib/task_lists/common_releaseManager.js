const execa = require('execa');
const fs = require('fs-extra');
const git = require('simple-git/promise');
const { getServerName, getServer } = require("./common_helpers");

const CHANGELOGFILE = "DEPLOY.log.md";
const SERVER_CHANGELOG = "/opt/cob-cli/DEPLOYLOG.md";
const LAST_SHA_FILE = "lastDeploySha"
const { SERVER_COB_CLI_DIRECTORY } = require("./common_helpers");
const SERVER_LAST_SHA_FILE = SERVER_COB_CLI_DIRECTORY + LAST_SHA_FILE;

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
        const user = require('whoami');
        const date = new Date();
        const newDeployText = 
            + "\n"
            + `\n Deployed by ${user}`
            + `\n Server ${server}`
            + `\n ${date}\n`;
            + diffs

        // Maintain server deploy file log
        await execa('ssh', [server, "echo '# Deploy_" + currentSha + newDeployText + "\n\n' >> " + SERVER_CHANGELOG])
        // Add deploy tags to repo
        await git().addAnnotatedTag("Deploy_"+currentSha, newDeployText )
    }
    setLastDeployedSha(server, currentSha);
}
exports.registerRelease = registerRelease;

/* ************************************ */
async function getLastDeployedSha(server) {
    let result
    try {
        result = await execa('ssh', [server, "cat " + SERVER_LAST_SHA_FILE ]);
    } catch (error) { 
        execa('ssh', [server, "mkdir -p " + SERVER_COB_CLI_DIRECTORY ]);
        return null
    }
    return result.stdout;
}
exports.getLastDeployedSha = getLastDeployedSha;

/* ************************************ */
function setLastDeployedSha(server, lastSha) {
    execa('ssh', [server, "echo '" + lastSha + "' > " + SERVER_LAST_SHA_FILE ]);
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