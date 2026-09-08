require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { confirmExecutionOfChanges } = require("../task_lists/common_syncFiles");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const { saveOperationState, clearOperationState } = require("../task_lists/common_operationState");

async function deploy(args) {
    checkRepoVersion()
    const cmdEnv = await getCurrentCommandEnviroment(args)
    if(args.resync) args.force = true;

    console.log(`Checking conditions to deploy ${cmdEnv.branchStr} to ${cmdEnv.serverStr}...` );

    await validateDeployConditions(cmdEnv,args).run()

    saveOperationState(cmdEnv.name, cmdEnv.servername)

    await cmdEnv.applyCurrentCommandEnvironmentChanges()
    let changes = [];
    try {
        changes = await confirmExecutionOfChanges(cmdEnv)
    } catch (err) {
        await cmdEnv.unApplyCurrentCommandEnvironmentChanges()
        clearOperationState()
        throw err
    }

    if(changes.length == 0) {
        if(!args.force) {
            await cmdEnv.unApplyCurrentCommandEnvironmentChanges()
            clearOperationState()
            console.log("\nCanceled!".yellow + " nothing todo\n")
            return
        }
        console.log(" Just updating deploy information.")
    }

    await executeTasks(cmdEnv, args).run();

    clearOperationState()
    console.log("\nDone!".green, "\nEnjoy!")
}
module.exports = deploy;
