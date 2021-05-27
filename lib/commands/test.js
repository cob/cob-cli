require('colors');
const opn = require('opn');
const { validateTestingConditions }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { getKeypress } = require("../task_lists/common_helpers");
const { checkVersion } = require("../commands/upgradeRepo");

async function test (args) {    
    let restoreChanges, error = "";
    let cmdEnv
    try {
        checkVersion()
        console.log("Start testing… ")
        cmdEnv = await getCurrentCommandEnviroment(args)

        if(!args.localOnly) {
            await validateTestingConditions(cmdEnv, args) 
            await cmdEnv.applyCurrentCommandEnvironmentChanges()
            restoreChanges = await otherFilesContiousReload(cmdEnv)
        } else {
            await cmdEnv.applyCurrentCommandEnvironmentChanges()
        }
        customUIsContinuosReload(cmdEnv, args.dashboard)
        
        console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, " + "CTRL+C".bold.red + " or " + "Q".bold.red + " to stop the tests... ").yellow.bold + "\n\n" )
        let key;
        do {
            key = await getKeypress()
            if(key == "o") opn("http://localhost:8040/recordm/index.html")
        } while( key != "q" && key != "ctrl+c" ) 

    } catch (err) { 
        error = err.message
        console.log("\n",error)
    } finally {
        cmdEnv && await cmdEnv.unApplyCurrentCommandEnvironmentChanges() // Repõe as configurações
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