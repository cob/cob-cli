require('colors');
const opn = require('opn');
const execa = require('execa');
const git = require('simple-git/promise');
const { validateTasksForTesting }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { SERVER_COB_CLI_DIRECTORY, getKeypress, getServerName, getServer, confirmExecutionOfChanges, resolveCobPath } = require("../task_lists/helpers");

const IN_PROGRESS_TEST_FILE = SERVER_COB_CLI_DIRECTORY + "test.in.execution"

async function test () {    
    let changedFiles = new Set()
    let server;
    try {
        const servername = getServerName()
        server = getServer(servername)

        console.log("Start testing… ")
        await validateTasksForTesting(server).run()
    
        let changes = await confirmExecutionOfChanges(server)

        for(let i = 0; i < changes.length; i++) {
            let change = changes[i]
            if(change) {
                let inUse = true
                const changedFile = change.split(" ");
                await execa('ssh', [server,"grep -F " + changedFile[1] + " " + IN_PROGRESS_TEST_FILE])
                .catch( (err) => {
                    /* grep returns error if no match. Execa throws an excepcions where return is error */
                    inUse = false
                    let product = changedFile[1].split("/")[0];
                    let file = changedFile[1].substring(changedFile[1].indexOf("/"))
                    let liveFileDir = resolveCobPath(server, "productionLive", product)
                    execa('ssh', [server,"echo '" + changedFile[1] + "' >> " + IN_PROGRESS_TEST_FILE])
                    changedFiles.add( changedFile[1] )
                    execa('rsync',  [changedFile[1], liveFileDir + file ,"-aczvi","--delete"])
                    .catch( async (err) => {
                        /* 12 & 23 é a indicar que directorias não existem, ie, não é um problema por isso não devolve erro */
                        if (err.exitCode == 12 || err.exitCode == 23) {
                            await execa('ssh',  [server,"rm -f " + liveFileDir.split(":")[1] + file])
                        } 
                    })
                    console.log( " " + changedFile[0].replace(/(e)([^e]*)$/,"ed$2 ") + changedFile[1])                     
                })
                if(inUse) throw new Error("Aborted:".brightYellow + " " + changedFile[1].blue.bold + " is already being tested by another developer")
            }
        }

        customUIsContinuosReload(server)
        let watcher = otherFilesContiousReload(server, changedFiles)
        
        console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, any other key " + "(except enter)".red + " to stop the tests... ").bgYellow.bold + "\n\n" )
        
        while( await getKeypress() == "o" ) opn("http://localhost:8040/recordm/index.html")

        watcher.close()

        throw new Error( "\n"
            + "Done".green +"\n"
            + "If you're happy with the test and everything is commited, you can deploy to production with: \n"
            + "\t cob-cli deploy\n")
    }
    catch (err) { 
        if(changedFiles.size > 0) {
            console.log("\nPut back files changed on server: ...".yellow);
            let stash = true;
            await git().stash(["--all"]).then( value => value.indexOf("Saved") == 0 || (stash = false))
            await git().checkoutLatestTag()

            for(let changedFile of changedFiles) {
                let product = changedFile.split("/")[0];
                let file = changedFile.substring(changedFile.indexOf("/")+1)
                let liveFileDir = resolveCobPath(server, "productionLive", product)
                await execa('rsync',  [changedFile, liveFileDir + file ,"-aczvi","--delete"])
                .catch( async (err) => {
                    /* 12 & 23 é a indicar que directorias não existem, ie, não é um problema por isso não devolve erro */
                    if (err.exitCode == 12 || err.exitCode == 23) {
                        await execa('ssh',  [server,"rm -f " + liveFileDir.split(":")[1] + file])
                    } 
                })
                await execa('ssh', [server,"sed -i '/" + changedFile.replace("/","\\/") + "/d'  " + IN_PROGRESS_TEST_FILE])
                console.log(" restored " + changedFile)
            }
            await execa('ssh', [server,"find " + IN_PROGRESS_TEST_FILE + " -size 0 -delete "])

            await git().checkout("-")
            if (stash) await git().stash(["pop"])
        }
        console.log("\n",err.message)
        process.exit()
    }
};
module.exports = test;