require('colors');
const opn = require('opn');
const { validateTestingConditions }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { getKeypress, getServerName, getServer } = require("../task_lists/common_helpers");

async function test (args) {    
    let restoreChanges, error = "";
    try {
        const servername = args.servername ? args.servername : getServerName()
        const server = getServer(servername)

        console.log("Start testing… ")
        if(!args.localOnly) {
            await validateTestingConditions(server, args) 
            restoreChanges = await otherFilesContiousReload(server)
        } 
        customUIsContinuosReload(server, args.dashboard)
        
        console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, any other key " + "(except enter)".red + " to stop the tests... ").yellow.bold + "\n\n" )
        while( await getKeypress() == "o" ) opn("http://localhost:8040/recordm/index.html")

    } catch (err) { 
        error = err.message
        console.log("\n",error)
    } finally {
        restoreChanges && await restoreChanges()
        process.kill(process.pid, "SIGINT");
        // Dá tempo aos subprocessos para morrer
        setTimeout(() => {
            if(!error) {
                console.log( "\n"
                + "Done".green +"\n"
                + "If you're happy with the test, after everything is commited, you can deploy to production with: \n"
                + "\t cob-cli deploy\n")
            }
            process.exit()
        }, 2000);
    }
}
module.exports = test