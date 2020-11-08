const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const user = require('whoami');
const { SERVER_COB_CLI_DIRECTORY } = require("./common_helpers");
const { confirmExecutionOfChanges, syncFile } = require("./common_syncFiles");
const { getLastDeployedSha } = require("./common_releaseManager");

const IN_PROGRESS_TEST_FILE = "test.in.execution"
const SERVER_IN_PROGRESS_TEST_FILE = SERVER_COB_CLI_DIRECTORY + IN_PROGRESS_TEST_FILE

/* ************************************ */
async function otherFilesContiousReload(server) {
    let watcher = {}
    let changedFiles = new Set()
    let changes = await confirmExecutionOfChanges(server,"--exclude=/customUI/")

    let restoreChanges = async () => {
        if(watcher.process) watcher.process.close();
        if(changedFiles.size > 0) {
            console.log("\nRestoring changed files...".yellow);
            let stash = true;
            await git().stash(["--include-untracked"]).then( value => value.indexOf("Saved") == 0 || (stash = false))
            let lastSha = await getLastDeployedSha(server)
            git().checkout(lastSha)

            for(let changedFile of changedFiles) {
                await removeFileFromCurrentTest(server, changedFile);
            }

            await git().checkout("-")
            if (stash) await git().stash(["pop"])
        }
        fs.unlinkSync("."+IN_PROGRESS_TEST_FILE)
    }

    fs.writeFileSync('.'+IN_PROGRESS_TEST_FILE, "in progress")
    
    changes.length && console.log("\n Making the changes...".yellow);
    for(let change of changes) {
        const changeType = change.split(" ")[0];
        const changedFile = change.split(" ")[1];
        await addFileToCurrentTest(server, changedFile, changedFiles, changeType, restoreChanges);
    }

    watcher.process = fs.watch('.', { recursive: true }, async (eventType, changedFile) => {
        if (
            changedFile 
            && changedFile.indexOf("/customUI/") < 0 
            && changedFile.indexOf(".git") < 0
            && changedFile.indexOf(IN_PROGRESS_TEST_FILE) < 0
        ) {
            await addFileToCurrentTest(server, changedFile, changedFiles, "Syncing".bgRed.bold + " ", restoreChanges );
            changedFiles.add(changedFile)
            
                if ( changedFile.indexOf("/services/") > 0 || changedFile.indexOf("/recordm-importer/") > 0 ) {
                process.stdout.write(" Warning: this sync requires a restart".yellow.bold + "\n");
            }
        }
    })
    
    return restoreChanges
}
exports.otherFilesContiousReload = otherFilesContiousReload

/* ************************************ */
async function addFileToCurrentTest(server, changedFile, changedFiles, changeType, restoreChanges) {
    let inUse = "";
    await execa('ssh', [server, "grep -F " + changedFile + " " + SERVER_IN_PROGRESS_TEST_FILE + ""])
    .then( value => inUse = value.stdout )
    .catch( () => { } ) /* grep returns error if no match and execa throws an excepcions when return is error */
    .finally( async () => {
        if (inUse != "" && changedFiles.has(changedFile) == false) {
            await restoreChanges()
            throw new Error("Aborted:".red + " there's at least one conflicting file with a previous test in progress:\n  " + inUse.blue);
        } 
        try {
            await syncFile(server, changedFile);
        } catch (err) {
            restoreChanges()
            throw new Error("Error:".red + err.message);            
        }
        
        if(!changedFiles.has(changedFile)) {
            execa('ssh', [server, "echo '" + changedFile + " by " + user + "' >> " + SERVER_IN_PROGRESS_TEST_FILE]);
            changedFiles.add(changedFile);
        } 
        console.log(" " + changeType.replace(/(e)([^e]*)$/, "ed$2 ") + changedFile);
    })
}

/* ************************************ */
async function removeFileFromCurrentTest(server, changedFile) {
    await syncFile(server, changedFile);
    await execa('ssh', [server, "mkdir -p " + SERVER_COB_CLI_DIRECTORY]);
    await execa('ssh', [server, "sed -i '/" + changedFile.split("/").join("\\/") + "/d'  " + SERVER_IN_PROGRESS_TEST_FILE]).catch( () => {/* ignore files removed by user */} );
    await execa('ssh', [server,"find " + SERVER_IN_PROGRESS_TEST_FILE + " -size 0 -delete "]) //Remove file if empty
    console.log(" reset ".brightGreen + changedFile);
}

/* ************************************ */
function checkNoTestsRunningOnServer(server) {
    return execa('ssh', [server, "cat " + SERVER_IN_PROGRESS_TEST_FILE])
            .then(value => { 
                throw new Error(
                        "Warning: file(s) being tested:\n  " 
                        + value.stdout.split("\n").join("\n  ") 
                        + "\nError:".bgRed + " Test in progress"
                    ); 
            })
            .catch( () => {} /* Error is good: test file doesn't exist */ )
}
exports.checkNoTestsRunningOnServer = checkNoTestsRunningOnServer