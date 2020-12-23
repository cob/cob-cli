const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const user = require('whoami');
const { SERVER_COB_CLI_DIRECTORY } = require("./common_helpers");
const { confirmExecutionOfChanges } = require("./common_syncFiles");
const { syncFile } = require("./test_syncFile");
const { getLastDeployedSha } = require("./common_releaseManager");

const IN_PROGRESS_TEST_FILE = "test.in.execution"
const SERVER_IN_PROGRESS_TEST_FILE = SERVER_COB_CLI_DIRECTORY + IN_PROGRESS_TEST_FILE
exports.SERVER_IN_PROGRESS_TEST_FILE = SERVER_IN_PROGRESS_TEST_FILE

/* ************************************ */
async function otherFilesContiousReload(server) {
    let watcher = {}
    let changedFiles = new Set()

    let currentTestsFilesList = []
    await execa('ssh', [server, "cat " + SERVER_IN_PROGRESS_TEST_FILE])
    .then( value => currentTestsFilesList = value.stdout.split("\n").map(l => l.substring(0,l.indexOf(" "))) )
    .catch( () => { } ) /* grep returns error if no match and execa throws an excepcions when return is error */
    
    let excludeTestFilesList = currentTestsFilesList.map(filepath => "--exclude=" + filepath.replace(/\//,"|"))
    let changes = await confirmExecutionOfChanges(server,excludeTestFilesList.concat("--exclude=/customUI/"))

    /* ************************************ */
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
            await execa('ssh', [server,"find " + SERVER_IN_PROGRESS_TEST_FILE + " -size 0 -delete "]) //Remove file if empty

            await git().checkout("-")
            if (stash) await git().stash(["pop"])
        }
        fs.unlinkSync("."+IN_PROGRESS_TEST_FILE)
    }
    /* ************************************ */

    fs.writeFileSync('.'+IN_PROGRESS_TEST_FILE, "in progress")

    changes.length && console.log("\n Making the changes...".yellow);
    for(let change of changes) {
        const changeType = change.split(" ")[0];
        const changedFile = change.split(" ")[1];
        await addFileToCurrentTest(server, changedFile, changedFiles, changeType, restoreChanges);
    }

    watcher.process = fs.watch('.', { recursive: true }, async (eventType, changedFile) => {
        let isFile = false;
        try {
            isFile = fs.lstatSync(changedFile).isFile()
        } catch {}

        if (
            isFile
            && changedFile.indexOf("/customUI/") < 0
            && !changedFile.startsWith(".git")
            && !changedFile.startsWith(".idea")
            && !changedFile.startsWith(".DS_Store") 
            && !changedFile.endsWith(".swp")
            && !changedFile.endsWith(".swap")
            && changedFile.indexOf(IN_PROGRESS_TEST_FILE) < 0
        ) {
            try {
                await addFileToCurrentTest(server, changedFile, changedFiles, " Syncing ".bgRed.bold + " ", restoreChanges );
                changedFiles.add(changedFile);
                if ( changedFile.indexOf("/services/") > 0 || changedFile.indexOf("/recordm-importer/") > 0 ) {
                    console.log(" Warning: this sync requires a restart".yellow.bold + "\n");
                }    
            } catch (err) {
                if(err.message != "Just skip") {
                    console.log(err.message)
                    await restoreChanges();
                    process.exit()
                }
            }
        }
    })
    return restoreChanges
}
exports.otherFilesContiousReload = otherFilesContiousReload

/* ************************************ */
async function addFileToCurrentTest(server, changedFile, changedFiles, changeType, restoreChanges) {
    let inUse = "";
    await execa('ssh', [server, "grep -F '" + changedFile + " ' " + SERVER_IN_PROGRESS_TEST_FILE ])
    .then( value => inUse = value.stdout )
    .catch( () => { } ) /* grep returns error if no match and execa throws an excepcions when return is error */
    .finally( async () => {
        if (inUse != "" && changedFiles.has(changedFile) == false) {
            console.log(" File not synced: there's a conflicting test in progress for this file:\n  ".yellow.bold + inUse.yellow);
            throw new Error("Just skip");
        }
        try {
            await syncFile(server, changedFile);
        } catch (err) {
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
    await execa('ssh', [server, "sed -i '/" + changedFile.split("/").join("\\/") + "/d'  " + SERVER_IN_PROGRESS_TEST_FILE]).catch( () => {/* ignore files removed by user */} );
    console.log(" reset ".brightGreen + changedFile);
}

/* ************************************ */
function checkNoTestsRunningOnServer(server) {
    return execa('ssh', [server, "cat " + SERVER_IN_PROGRESS_TEST_FILE])
            .then(value => {
                throw new Error(
                        "Aborted:".red + " there are tests running with files changed on the server:\n  "
                        + value.stdout.blue.split("\n").join("\n  ")
                        + "\n\n" + "Error:".bgRed + " Tests in progress\n"
                    );
            })
            .catch( (err) => {
                if(err.message.indexOf("No such file or directory") < 0) {
                    throw new Error(err.message)
                }   
            } /* Error is good: test file doesn't exist */ )
}
exports.checkNoTestsRunningOnServer = checkNoTestsRunningOnServer