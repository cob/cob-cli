require('colors');
const { getServerName, getServer, confirmExecutionOfChanges } = require("../task_lists/helpers");
const { validateTasksForDeploy } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");

async function deploy(args) {
    try {
        const servername = getServerName()
        const server = getServer(servername)
        await validateTasksForDeploy(server,args).run()

        let changes = await confirmExecutionOfChanges(server)
        if(changes.length == 0) {
            throw new Error("Canceled:".yellow + " nothing todo\n")
        }

        await executeTasks(server).run() 
        console.log("\nDone!".green, "\nEnjoy!")
        
    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = deploy;