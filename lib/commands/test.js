require('colors');
const opn = require('opn');
const { validateTestingConditions }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { getKeypress, getServerName, getServer } = require("../task_lists/helpers");

async function test (args) {    
    let restoreChanges, error = "";
    try {
        let server = getServer(getServerName())

        console.log("Start testing… ")
        await validateTestingConditions(server).run()
    
        restoreChanges = await otherFilesContiousReload(server)
        customUIsContinuosReload(server, args.dashboard)
        
        console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, any other key " + "(except enter)".red + " to stop the tests... ").bgYellow.bold + "\n\n" )
        while( await getKeypress() == "o" ) opn("http://localhost:8040/recordm/index.html")

    } catch (err) { 
        error = err.message
    } finally {
        restoreChanges && await restoreChanges()
        process.kill(process.pid, "SIGINT");
        // Dá tempo aos subprocessos para morrer
        setTimeout(() => {
            if(error) {
                console.log("\n",error)
            } else {    
                console.log( "\n"
                + "Done".green +"\n"
                + "If you're happy with the test, after everything is commited, you can deploy to production with: \n"
                + "\t cob-cli deploy\n")
            }
            process.exit()
        }, 1000);
    }
}
module.exports = test

/* ************************************ */
// Tests:
// cob-cli test (server synched with local)         -> should start webpack locally, proxying every request for the server except those located in customUI directories of each product
//                                                  -> all other directories are also watched and any change (add, delete or alter) is propagated to the server, without confirmation
//                                                  -> if 'O' or 'o' key is pressed it should open the default browser in the login page of recordm
//                                                  -> if any key but 'enter' is pressed it should stop the server and restore all original files on server, even ctrl-c
// cob-cli test (with local changes)                -> Every diference betwen local files and live that are not within customUI directories should be listed and a confirmation of procedding with changes is requested
//                                                  -> after that the previous behavior applies
// cob-cli test (with other test running)           -> If another test is running on the same repo (creating a local .test.in.execution file) execution is aborted
// cob-cli test (with other test running on server) -> If another test is running on the server there will be a /opt/cob-cli../test.in.execution with the current changes. Any change that would generate a conflict will abort the test, restoring already changed files
// cob-cli test (with server having changes) -> If another test is running on the server there will be a /opt/cob-cli../test.in.execution with the current changes. Any change that would generate a conflict will abort the test, restoring already changed files
