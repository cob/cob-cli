require('colors');
const opn = require('open');
const { validateTestingConditions }  = require("../task_lists/test_validate");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { getKeypress } = require("../task_lists/common_helpers");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const { saveOperationState, clearOperationState, checkNoInterruptedRun } = require("../task_lists/common_operationState");

async function test (args) {
    let restoreChanges, error = "";
    let cmdEnv
    let spawned
    let stateSaved = false

    let rejectOnSignal;
    const signalPromise = new Promise((_, reject) => { rejectOnSignal = reject; });
    const handleSignal = () => rejectOnSignal(new Error('signal'));
    process.once('SIGTERM', handleSignal);
    process.once('SIGHUP', handleSignal);

    try {
        checkRepoVersion()
        console.log("Start testing… ")
        cmdEnv = await getCurrentCommandEnviroment(args)
        await checkNoInterruptedRun()
        saveOperationState(cmdEnv.name, cmdEnv.servername)
        stateSaved = true

        if(!args.localOnly) {
            await validateTestingConditions(cmdEnv, args)
            await cmdEnv.applyCurrentCommandEnvironmentChanges()
            restoreChanges = await otherFilesContiousReload(cmdEnv)
        } else {
            await cmdEnv.applyCurrentCommandEnvironmentChanges()
        }
        spawned = await customUIsContinuosReload(cmdEnv, args.dashboard)

        let key;
        do {
            key = await Promise.race([getKeypress(), signalPromise, spawned.failed]);
            if(key == "o") opn("http://localhost:8040/recordm/index.html")
        } while( key != "q" && key != "ctrl+c" )

    } catch (err) {
        if(err.message !== 'signal' && err.message !== 'processes-failed') {
            error = err.message
            console.log("\n",error)
        }
    } finally {
        process.off('SIGTERM', handleSignal);
        process.off('SIGHUP', handleSignal);
        try { process.stdin.setRawMode(false); } catch {}
        cmdEnv && await cmdEnv.unApplyCurrentCommandEnvironmentChanges() // Repõe as configurações
        restoreChanges && await restoreChanges()
        if (stateSaved) clearOperationState()
        spawned && await spawned.stop();
        // Dá tempo aos subprocessos para morrer (acho que já não é preciso)
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
