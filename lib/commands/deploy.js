require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { confirmExecutionOfChanges } = require("../task_lists/common_syncFiles");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");
const { checkRepoVersion } = require("../commands/upgradeRepo");

async function deploy(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)
        if(args.resync) args.force = true;

        console.log(`Checking conditions to deploy ${cmdEnv.branchStr} to ${cmdEnv.serverStr}...` );

        await validateDeployConditions(cmdEnv,args).run()

        await cmdEnv.applyCurrentCommandEnvironmentChanges()
        let changes = [];
        try {
            changes = await confirmExecutionOfChanges(cmdEnv)
        } catch (err) {
            await cmdEnv.unApplyCurrentCommandEnvironmentChanges()
            throw err
        }

        if(changes.length == 0) {
            if(!args.force) {
                await cmdEnv.unApplyCurrentCommandEnvironmentChanges()
                throw new Error("Canceled:".yellow + " nothing todo\n")
            }
            console.log(" Just updating deploy information.")
        }

        await executeTasks(cmdEnv, args).run();

        console.log("\nDone!".green, "\nEnjoy!")

    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = deploy;