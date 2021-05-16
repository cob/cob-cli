require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { newProjectTasks } = require("../task_lists/init_newProject");
const { existingProjectTasks } = require("../task_lists/init_existingProject");
const { getServer } = require("../task_lists/common_enviromentHandler");
const fs = require('fs-extra');
const axios = require('axios');
const git = require('simple-git/promise');

/* ******************************** MAIN LOGIC **************************************** */
async function init(args) {
    const cmdEnv = await getCurrentCommandEnviroment(args)
    const projectName = "server_"+cmdEnv.serverName;
    const repo = args.repoaccount + (args.repoaccount.slice(-1) == "/" ? "" : "/")  + projectName;
    
    let initTasks;
    if(await projectExistsInGitAccount(projectName,args.repoaccount) ) {
        if(args.legacy) {
            console.log("\nError:".red + " '--legacy' is an invalid option for an already existing repositories\n")
            return
        } else {
            console.log("\nGetting project", repo.bold.blue, ":" );
            initTasks = existingProjectTasks(repo);
        }
    } else if( projectPathOkFor(projectName) && await notInsideGitRepo() && await validCobServer(cmdEnv.server)) {
        console.log("\nCreating project", projectName.bold.blue );
        initTasks = newProjectTasks(cmdEnv, projectName, repo, args )
    } else {
        return //Error
    }

    initTasks.run()
    .then( () => {
        console.log("\nDone!".green, "\nTry:");
        console.log("\tcd "+projectName)
        console.log("\tcob-cli customize\n")
    })
    .catch(err => {
        console.error("\n",err.message);
    })
}
module.exports = init;

/* ************************************ */
function projectPathOkFor(projectName) {
    let pathExist = fs.pathExistsSync(projectName);
    if(!pathExist) return true
    console.log("\nError:".red, "directory", projectName.blue.italic ,"already exists.\n" );
}

/* ************************************ */
async function notInsideGitRepo() {
    let isRepo = await git().checkIsRepo()
    if(!isRepo) return true
    console.log("\nError:".red,"current directory is part of a repository git.\n");
}

/* ************************************ */
async function validCobServer(server) {
    var result; 
    try {
        result = await axios.get("https://"+server+"/health")
    } catch {}
    
    if(result && result.status == "200") return true
    console.log("\nError:".red, server.blue.bold, "is not a valid CoB server. Failed to get cob-health.\n");
}

/* ************************************ */
async function projectExistsInGitAccount(projectName, repoaccount) {
    try {
        await git().silent(true).listRemote(repoaccount + projectName);
        return true;
    } catch {}
}