require('colors');
const { getEnviroment } = require("../task_lists/common_enviromentManager");
const { confirmExecutionOfChanges } = require("../task_lists/common_syncFiles");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");

async function deploy(args) {
    try {
        const env = await getEnviroment(args)
        if(args.resync) args.force = true;

        console.log(`Checking conditions to deploy ${env.branchStr} to ${env.serverStr}...` );

        await validateDeployConditions(env,args).run()

        let changes = await confirmExecutionOfChanges(env)
        if(changes.length == 0) {
            if(!args.force) {
                throw new Error("Canceled:".yellow + " nothing todo\n")
            }
            console.log(" Just updating deploy information.")
        }

        await executeTasks(env, args).run();

        console.log("\nDone!".green, "\nEnjoy!")

    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = deploy;