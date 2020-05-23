require('colors');
const { getServerName, getServer } = require("../task_lists/helpers");
const { validateTasks } = require("../task_lists/deploy_validate");
const { showDiffs } = require("../task_lists/deploy_showDiffs");
const { executeTasks } = require("../task_lists/deploy_execute");

async function deploy(args) {
    const servername = getServerName()
    const server = getServer(servername)
    
    if( servername ) {
        validateTasks(server,args).run()
        .then( () => showDiffs(server) )
        .then( () => executeTasks(server).run() )
        .then( () => console.log("\nDone!".green, "\nEnjoy!") )
        .catch(err => {
            console.error("\n",err.message);
        })
    }
}
module.exports = deploy;