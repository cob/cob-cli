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
                    if (gitLog.all[i].message.startsWith("Deploy ")) {
                        // Don't include deploy lines in diffs.
                        // ATTENTION: Match string above needs to be in accordance with releaseSignature() beggining string
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
        const newDeployText = 
            releaseSignature(currentBranch, currentSha, server) 
            + "\n"
            + `\n Deployed by ${user}`
            + `\n ${date}\n`;
            + diffs

        // Maintain server deploy file log
        await execa('ssh', [server, "echo '# " + newDeployText + "\n\n' >> " + SERVER_CHANGELOG])
        
        let isDefaultServer = server == getServer(getServerName())
        await git().addAnnotatedTag("Deploy_"+currentSha+(isDefaultServer?"":"_"+server) , newDeployText )
    }
    setLastDeployedSha(server, currentSha);
}
exports.registerRelease = registerRelease;

/* ************************************ */
async function getLastDeployedSha(server) {
    let result = await execa('ssh', [server, "cat " + SERVER_LAST_SHA_FILE + " || echo '' "]);
    return result.stdout;
}
exports.getLastDeployedSha = getLastDeployedSha;

/* ************************************ */
function setLastDeployedSha(server, lastSha) {
    execa('ssh', [server, "mkdir -p " + SERVER_COB_CLI_DIRECTORY + "; echo '" + lastSha + "' > " + SERVER_LAST_SHA_FILE]);
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
    //ATTENTION: beggining string of Signature needs to be in accordance with registerRelease() deploy test condition
    let isDefaultServer = server == getServer(getServerName())

    let signature = 
        "Deploy "
        + sha
        + (branch != "master" ? " (branch: " + branch + ")" : "")
        + (isDefaultServer ? "" : " to " + server)
    return signature;
}
