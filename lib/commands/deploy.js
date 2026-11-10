require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { confirmExecutionOfChanges } = require("../task_lists/common_syncFiles");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const { saveOperationState, clearOperationState } = require("../task_lists/common_operationState");
const { getLastDeployedSha } = require("../task_lists/common_releaseManager");
const { getCustomizationsChange, getDeployedCustomizations, registerCustomizations } = require("../task_lists/updateCustomizationsInventory");

async function deploy(args) {
    checkRepoVersion()
    const cmdEnv = await getCurrentCommandEnviroment(args)
    if(args.customizationsInventoryOnly) return await registerLastDeployCustomizations(cmdEnv, args)
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
    const customizations = await customizationsToRegister(cmdEnv)

    await executeTasks(cmdEnv, args).run();

    clearOperationState()

    if(customizations) {
        console.log("\nCustomization versions changed since last deploy.")
        await registerCustomizations(cmdEnv, args, customizations)
    }

    console.log("\nDone!".green, "\nEnjoy!")
}

/* ************************************ */
// The inventory is about what is in use in production: only prod deploys count, and only when
// customizations.json changed since the last deploy. If registering fails or is skipped there is no
// later deploy to do it, so it's retried with --customizationsInventoryOnly (--force is not for this).
async function customizationsToRegister(cmdEnv) {
    if(cmdEnv.name != "prod") return null
    try {
        const { current, changed } = await getCustomizationsChange(await getLastDeployedSha(cmdEnv.server))
        return changed ? current : null
    } catch (err) {
        // An invalid customizations.json must never be registered as "no customizations"
        console.log("\nWarning:".yellow + " customization versions not registered, couldn't check for changes (" + err.message + ")")
        return null
    }
}

/* ************************************ */
// --customizationsInventoryOnly: registers again the versions of what the last deploy left on the
// server, without deploying anything.
async function registerLastDeployCustomizations(cmdEnv, args) {
    if(cmdEnv.name != "prod") {
        throw new Error("\nError: ".red + "--customizationsInventoryOnly only applies to the " + "prod".bold.blue + " environment, the inventory is about what is in use in production.\n")
    }

    console.log(`Registering the customization versions of the last deploy to ${cmdEnv.serverStr} (nothing is deployed)...\n`)

    let customizations
    try {
        customizations = await getDeployedCustomizations(await getLastDeployedSha(cmdEnv.server))
    } catch (err) {
        throw new Error("\nError: ".red + "couldn't find the customization versions of the last deploy: " + err.message + "\n")
    }

    if(await registerCustomizations(cmdEnv, args, customizations)) {
        console.log("\nDone!".green)
    } else {
        process.exitCode = 1
    }
}

module.exports = deploy;
