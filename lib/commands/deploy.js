require('colors');
const { getServerName, getServer } = require("../task_lists/common_helpers");
const { getCurrentBranch } = require("../task_lists/common_releaseManager");
const { confirmExecutionOfChanges } = require("../task_lists/common_syncFiles");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");

async function deploy(args) {
    try {
        if(args.resync) args.force = true;

        const servername = args.servername ? args.servername : getServerName()
        const server = getServer(servername)

        let defaultserver = getServer(getServerName());
        let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";

        let currentBranch = await getCurrentBranch();
        let branchStr = currentBranch == "master" ? "master".bold.blue : currentBranch.bgRed + " " ;

        console.log(`Checking conditions to deploy ${branchStr} to ${serverStr}...` );

        await validateDeployConditions(server,args).run()

        let changes = await confirmExecutionOfChanges(server)
        if(changes.length == 0) {
            if(!args.force) {
                throw new Error("Canceled:".yellow + " nothing todo\n")
            }
            console.log(" Just updating deploy information.")
        }

        await executeTasks(server, args).run() 
        
        console.log("\nDone!".green, "\nEnjoy!")
        
    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = deploy;