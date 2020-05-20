const colors = require('colors');
const { validateTasks } = require("../task_lists/deploy_validate");
const { showDiffs } = require("../task_lists/deploy_showDiffs");
const { executeTasks } = require("../task_lists/deploy_execute");
const fs = require('fs-extra');

/* ************************************************************************ */

async function deploy(args) {
    const serverName = getServerName();

    if( serverName ) {
        validateTasks(serverName,args).run()
        .then( () => console.log("\nValidation done!") )
        .then( () => showDiffs(serverName) )
        .then( () => executeTasks(serverName).run() )
        .then( () => console.log("\nDone!".green, "\nEnjoy!") )
        .catch(err => {
            console.error("\n",err);
        })
    }  
}
module.exports = deploy;

/* *************************** PRE EXECUTION VALIDATIONS ********************************** */

function getServerName() {
    try {
        var data = fs.readFileSync('.server', 'utf8');
        return data;    
    } catch(e) {
        console.log(colors.red("\nError:"),"´.server´ not found. `deploy` should be run inside project directory.\n" );
    }
        
}