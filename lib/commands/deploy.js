require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { confirmExecutionOfChanges } = require("../task_lists/common_syncFiles");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const { saveOperationState, clearOperationState } = require("../task_lists/common_operationState");
const { getLastDeployedSha } = require("../task_lists/common_releaseManager");
const { getCustomizationsChange, registerCustomizations } = require("../task_lists/deploy_customizations");

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

    // Has to be evaluated before the deploy replaces the lastDeploySha on the server
    const customizations = await customizationsToRegister(cmdEnv, args)

    await executeTasks(cmdEnv, args).run();

    clearOperationState()

    if(customizations) await registerCustomizations(cmdEnv, args, customizations)

    console.log("\nDone!".green, "\nEnjoy!")
}

/* ************************************ */
// The inventory is about what is in use in production: only prod deploys count, and only when
// customizations.json changed since the last deploy (or with --force, to retry a failed register).
async function customizationsToRegister(cmdEnv, args) {
    if(cmdEnv.name != "prod") return null
    try {
        const { current, changed } = await getCustomizationsChange(await getLastDeployedSha(cmdEnv.server))
        const hasCustomizations = Object.keys(current).length > 0
        return (changed || (args.force && hasCustomizations)) ? current : null
    } catch (err) {
        console.log("Warning:".yellow + " couldn't check for changes in customization versions (" + err.message + ")")
        return null
    }
}

module.exports = deploy;
