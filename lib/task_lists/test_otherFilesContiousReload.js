const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const { SERVER_COB_CLI_DIRECTORY, confirmExecutionOfChanges, syncFile } = require("../task_lists/helpers");

const IN_PROGRESS_TEST_FILE = "test.in.execution"
const SERVER_IN_PROGRESS_TEST_FILE = SERVER_COB_CLI_DIRECTORY + IN_PROGRESS_TEST_FILE


    let changes = await confirmExecutionOfChanges(server)

    console.log("\n Making the changes...".yellow);
    let changedFiles = new Set()
    for(let change of changes) {
        const changeType = change.split(" ")[0];
        const changedFile = change.split(" ")[1];
        await addFileToCurrentTest(server, changedFile, changedFiles, changeType);
    }

    let watcher = fs.watch('.', { recursive: true }, async (eventType, changedFile) => {
        if (changedFile && changedFile.indexOf("/customUI/") < 0 && changedFile.indexOf(".git") < 0) {
            process.stdout.write(" Syncing ".bgRed.bold + " " + changedFile + "\n");
            await addFileToCurrentTest(server, changedFile, changedFiles, eventType == "rename" ? "add/remove" : "change");
            changedFiles.add(changedFile)
            
            if ( changedFile.indexOf("/services/") > 0 ) {
                process.stdout.write(" Warning: this sync requires a restart".yellow.bold + "\n");
            }
        }
    })
    
    let restoreChanges = async () => {
        watcher.close();
        if(changedFiles.size > 0) {
            console.log("\nRestoring changed files...".yellow);
            let stash = true;
            await git().stash(["--all"]).then( value => value.indexOf("Saved") == 0 || (stash = false))
            await git().checkoutLatestTag()

            for(let changedFile of changedFiles) {
                await removeFileFromCurrentTest(server, changedFile);
            }

            await git().checkout("-")
            if (stash) await git().stash(["pop"])
        }
    }

    return restoreChanges
}
exports.otherFilesContiousReload = otherFilesContiousReload

/* ************************************ */
async function addFileToCurrentTest(server, changedFile, changedFiles, changeType) {
    let inUse = true;
    await execa('ssh', [server, "grep -F " + changedFile + " " + IN_PROGRESS_TEST_FILE + ""])
    .catch( () => inUse = false ) /* grep returns error if no match and execa throws an excepcions when return is error */
    .finally( async () => {
        if (inUse && changedFiles.has(changedFile) == false) {
            throw new Error("Aborted:".brightYellow + " " + changedFile.blue.bold + " is already being tested by another developer");
        } 
        await syncFile(server, changedFile);
        if(inUse == false) {
            execa('ssh', [server, "echo '" + changedFile + "' >> " + IN_PROGRESS_TEST_FILE]);
            changedFiles.add(changedFile);
        } 
        console.log(" " + changeType.replace(/(e)([^e]*)$/, "ed$2 ") + changedFile);
    })
}

/* ************************************ */
async function removeFileFromCurrentTest(server, changedFile) {
    await syncFile(server, changedFile);

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
}