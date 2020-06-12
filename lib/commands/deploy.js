require('colors');
const { getServerName, getServer, confirmExecutionOfChanges } = require("../task_lists/helpers");
const { validateDeployConditions } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");

async function deploy(args) {
    try {
        if(args.resync) args.force = true;

        const servername = getServerName()
        const server = getServer(servername)

        await validateDeployConditions(server,args).run()

        let changes = await confirmExecutionOfChanges(server)
        if(changes.length == 0) {
            if(!args.force) {
                throw new Error("Canceled:".yellow + " nothing todo\n")
            }
            console.log("No changes detected. Just force reseting server checkout.")
        }

        await executeTasks(server).run() 
        
        console.log("\nDone!".green, "\nEnjoy!")
        
    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = deploy;

/* ************************************ */
// Tests:
// cob-cli deploy                             -> After validate conditions should present changes to be made and ask for confirmation. If given change files live and in server checkout.
// cob-cli deploy (no changes)                -> Should stop with nothing todo warning
// cob-cli deploy (unclean git dir)           -> should stop and indicate git status 
// cob-cli deploy (conflits live or checkout) -> should stop and indicate existing conflicts (should ends in master branch, as initiated)
// cob-cli deploy --force                     -> should ignore conflits but not unclean git
// cob-cli deploy --force (nochanges to live) -> same as above but will only copies to server's checkout and doesn't give any info regarding the existing changes
