const colors = require('colors');
const { deployTasks } = require("../task_lists/deploy_tasks");
const fs = require('fs-extra');
const git = require('simple-git/promise');

/* ************************************************************************ */

async function deploy() {
    const serverName = getServerName();

    if( serverName ) {
        let tasks = deployTasks(serverName)
        tasks && tasks
            .run()
            .then( () => {
                console.log(colors.green("\nDone!"), "\nEnjoy!");
            })
            .catch(err => {
                console.error("\n",err.message);
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