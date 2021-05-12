require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { confirmExecutionOfChanges } = require("../task_lists/common_syncFiles");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");

async function deploy(args) {
    try {
        const cmdEnv = await getCurrentCommandEnviroment(args)
        if(args.resync) args.force = true;

        console.log(`Checking conditions to deploy ${cmdEnv.branchStr} to ${cmdEnv.serverStr}...` );

        await validateDeployConditions(cmdEnv,args).run()

        let changes = await confirmExecutionOfChanges(cmdEnv)
        if(changes.length == 0) {
            if(!args.force) {
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