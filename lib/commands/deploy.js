require('colors');
const { validateTasks } = require("../task_lists/deploy_validate");
const { showDiffs } = require("../task_lists/deploy_showDiffs");
const { executeTasks } = require("../task_lists/deploy_execute");
const { getServerName, getServer } = require("../task_lists/helpers");

async function deploy(args) {
    const servername = getServerName()
    
    if( servername ) {
        const server = getServer(servername)
        validateTasks(server,args).run()
        .then( () => showDiffs(server) )
        .then( () => executeTasks(server).run() )
        .then( () => console.log("\nDone!".green, "\nEnjoy!") )
        .catch(err => {
            console.error("\n",err);
        })
    }
}
module.exports = deploy;