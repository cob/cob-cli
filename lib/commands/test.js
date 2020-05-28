require('colors');
const opn = require('opn');
const { validateTestingConditions }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { getKeypress, getServerName, getServer } = require("../task_lists/helpers");

async function test () {    
    let restoreChanges, error = "";
    try {
        let server = getServer(getServerName())

        console.log("Start testing… ")
        await validateTestingConditions(server).run()
    
        restoreChanges = await otherFilesContiousReload(server)
        customUIsContinuosReload(server)
        
        console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, any other key " + "(except enter)".red + " to stop the tests... ").bgYellow.bold + "\n\n" )
        while( await getKeypress() == "o" ) opn("http://localhost:8040/recordm/index.html")

    } catch (err) { 
        error = err.message
    } finally {
        restoreChanges && await restoreChanges()
        if(error) {
            console.log("\n",error)
        } else {    
            console.log( "\n"
            + "Done".green +"\n"
            + "If you're happy with the test, after everything is commited, you can deploy to production with: \n"
            + "\t cob-cli deploy\n")
        }
        process.exit()
    }
}
module.exports = test