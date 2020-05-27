require('colors');
const opn = require('opn');
const execa = require('execa');
const git = require('simple-git/promise');
const { validateTasksForTesting }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { SERVER_COB_CLI_DIRECTORY, getKeypress, getServerName, getServer, confirmExecutionOfChanges, syncFile } = require("../task_lists/helpers");

const IN_PROGRESS_TEST_FILE = SERVER_COB_CLI_DIRECTORY + "test.in.execution"

async function test () {    
    let error = null;
    let changedFiles = new Set()
    let server;
    try {
        const servername = getServerName()
        server = getServer(servername)

        console.log("Start testing… ")
        await validateTasksForTesting(server).run()
    
        let changes = await confirmExecutionOfChanges(server)
        for(let change of changes) {
            let inUse = true
            const operation = change.split(" ")[0];
            const changedFile = change.split(" ")[1];

            await execa('ssh', [server,"grep -F " + changedFile + " " + IN_PROGRESS_TEST_FILE + ""])
            .catch( async (err) => {
                /* grep returns error if no match and execa throws an excepcions when return is error */
                inUse = false
                await syncFile(server, changedFile);                    
                execa('ssh', [server,"echo '" + changedFile + "' >> " + IN_PROGRESS_TEST_FILE])
                changedFiles.add( changedFile )
                console.log( " " + operation.replace(/(e)([^e]*)$/,"ed$2 ") + changedFile)                     
            })
            if(inUse) throw new Error("Aborted:".brightYellow + " " + changedFile[1].blue.bold + " is already being tested by another developer")
        }

        customUIsContinuosReload(server)
        let watcher = otherFilesContiousReload(server, changedFiles)
        
        console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, any other key " + "(except enter)".red + " to stop the tests... ").bgYellow.bold + "\n\n" )
        while( await getKeypress() == "o" ) opn("http://localhost:8040/recordm/index.html")
        watcher.close()

    } catch (err) { 
        error = err.message
    } finally {
        if(changedFiles.size > 0) {
            console.log("\nPut back files changed on server: ...".yellow);
            let stash = true;
            await git().stash(["--all"]).then( value => value.indexOf("Saved") == 0 || (stash = false))
            await git().checkoutLatestTag()

            for(let changedFile of changedFiles) {
                await syncFile(server,changedFile);
                await execa('ssh', [server,"sed -i '/" + changedFile.replace("/","\\/") + "/d'  " + IN_PROGRESS_TEST_FILE])
                console.log(" restored " + changedFile)
            }
            await execa('ssh', [server,"find " + IN_PROGRESS_TEST_FILE + " -size 0 -delete "])

            await git().checkout("-")
            if (stash) await git().stash(["pop"])
        }

        if(error) {
            console.log("\n",error)
        } else {    
            console.log( "\n"
            + "Done".green +"\n"
            + "If you're happy with the test and everything is commited, you can deploy to production with: \n"
            + "\t cob-cli deploy\n")
        }
        process.exit()
    }
}
module.exports = test