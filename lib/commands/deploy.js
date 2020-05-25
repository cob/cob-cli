require('colors');
const { getServerName, getServer } = require("../task_lists/helpers");
const { validateTasksForDeploy } = require("../task_lists/deploy_validate");
const { showDiffs } = require("../task_lists/deploy_showDiffs");
const { executeTasks } = require("../task_lists/deploy_execute");

async function deploy(args) {
    try {
        const servername = getServerName()
        const server = getServer(servername)
        await validateTasksForDeploy(server,args).run()
        await showDiffs(server) 
        await executeTasks(server).run() 
        console.log("\nDone!".green, "\nEnjoy!")
    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = deploy;