const execa = require('execa');
const fs = require('fs-extra');
const git = require('simple-git/promise');

const SERVER_CHANGELOG = "/opt/cob-cli/DEPLOYLOG.md";
const LAST_SHA_FILE = "lastDeploySha"
const { SERVER_COB_CLI_DIRECTORY } = require("./common_helpers");
const SERVER_LAST_SHA_FILE = SERVER_COB_CLI_DIRECTORY + LAST_SHA_FILE;

/* ************************************ */
async function registerRelease(server, currentBranch) {
    let diffs = "";
    let currentSha = await getCurrentSha();
    let lastSha = await getLastDeployedSha(server);

    if (!lastSha) {
        diffs = "\n\n * First deploy\n";
    } else {
        if (lastSha != currentSha) { // Only if diferent SHA, otherwise wont do anything, it's a re-deploy
            let gitLog = await git().log([lastSha + ".." + currentSha]);
            if (gitLog.all.length) {
                for (let i = 0; i < gitLog.all.length; i++) {
                    diffs = diffs
                        + "\n\t * "
                        + gitLog.all[i].message
                        + " [" + gitLog.all[i].hash.slice(0,7) + "]";
                }
                diffs += "\n\n"
            }
        }
    }

    // Maintain server deploy file log
    const user = require('whoami');
    const date = new Date();
    const dateStr = date.toISOString().slice(0,10).replace(/-/g,".")
    const dateTimeStr = date.toISOString().slice(0,16).replace(/T/," ")
    const serverName = server.substring(0,server.indexOf(".cultofbits.com"))
    const deploySignature = serverName + "_" + dateStr
    const newDeployText = `${dateTimeStr} ${user} [${currentSha}/${currentBranch}]`
    await execa('ssh', [server, "echo $'" + newDeployText + "\n" + diffs.replace(/'/g,"\\'") + "' >> " + SERVER_CHANGELOG])

    if (diffs) {
        // Add deploy tags to repo
        try {        
            await git().tag([deploySignature, "-d"])
        } catch {}

        try {        
            await git().push(["--delete", "origin", deploySignature])
        } catch {}

        await git().addAnnotatedTag(deploySignature, newDeployText )
        await git().push(["origin", deploySignature])
        git().fetch(["--tags"]) // Apenas para ter certeza que temos todas as tags
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