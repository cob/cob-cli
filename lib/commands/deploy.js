const colors = require('colors');
const { validateTasks } = require("../task_lists/deploy_validate");
const { executeTasks } = require("../task_lists/deploy_execute");
const fs = require('fs-extra');
const git = require('simple-git/promise');

/* ************************************************************************ */

async function deploy(args) {
    const serverName = getServerName();

    if( serverName ) {
        let tasks = validateTasks(serverName,args)
        tasks
            .run()
            .then( () => {
                console.log(colors.green("\nValidation  done!"), " Proceding to copying files to server...");
                let execution = executeTasks(serverName)
                execution
                    .run()
                    .then( () => {
                        console.log(colors.green("\nDone!"), "\nEnjoy!");
                    })
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