require('colors');
const opn = require('opn');
const { validateTasksForTesting }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { getKeypress, getServerName, getServer, diffFiles } = require("../task_lists/helpers");

async function test () {    
    try {
        const servername = getServerName()
        const server = getServer(servername)

        console.log("Start testing… ")
        await validateTasksForTesting(server).run()
    
        let changes = await diffFiles(server, "localMaster", "productionLive")
        let changedFiles = new Set()
        if(changes.length) {
            console.log("\nThis will start with:")
            console.log(" " + changes.join("\n "))
            console.log("\n" + "Continue? [y/N] ".brightYellow.bold + " ")
            let answer = await getKeypress()
            if(answer != "y") {
                console.log("\nError:".brightYellow + " Aborted by user\n" );    
                return
            }
            changes.forEach( change => {
                change && changedFiles.add( change.split(" ")[1] )
            });
        } 

        customUIsContinuosReload(server)
        otherFilesContiousReload(server, changedFiles)
        
        console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, any other key " + "(except enter)".red + " to stop the tests... ").bgYellow.bold + "\n\n" )
        
        while( await getKeypress() == "o" ) opn("http://localhost:8040/recordm/index.html")

        console.log("\nPut back files changed on server: ...".yellow);
        changedFiles.forEach( file => console.log(" restoring " + file))

        console.log("\nDone".green, "\nIf everything is ok, and commited, you can now run:");
        console.log("\tcob-cli deploy\n")
        process.exit()
    }
    catch (err) { console.error("\n",err.message) }
};
module.exports = test;