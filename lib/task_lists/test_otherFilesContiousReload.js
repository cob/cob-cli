const fs = require('fs-extra');
const execa = require('execa');
const { SERVER_COB_CLI_DIRECTORY, syncFile } = require("../task_lists/helpers");

const IN_PROGRESS_TEST_FILE = SERVER_COB_CLI_DIRECTORY + "test.in.execution"
exports.IN_PROGRESS_TEST_FILE = IN_PROGRESS_TEST_FILE

function otherFilesContiousReload(server, changedFiles) {
    return fs.watch('.', { recursive: true }, async (eventType, changedFile) => {
        if (changedFile && changedFile.indexOf("m/customUI") < 0 && changedFile.indexOf(".git") < 0) {
            process.stdout.write(" Syncing ".bgRed.bold + " " + changedFile + "\n");
            await addFileToCurrentTest(server, changedFile, changedFiles, eventType == "rename" ? "add/remove" : "change");
            changedFiles.add(changedFile)

            if ( changedFile.indexOf("/services/") > 0 ) {
                process.stdout.write(" Warning: this sync requires a restart".yellow.bold + "\n");
            }
        }
    })
}
exports.otherFilesContiousReload = otherFilesContiousReload;

/* ************************************ */
async function addFileToCurrentTest(server, changedFile, changedFiles, operation) {
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
        console.log(" " + operation.replace(/(e)([^e]*)$/, "ed$2 ") + changedFile);
    })
}
exports.addFileToCurrentTest = addFileToCurrentTest