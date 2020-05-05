const colors = require('colors');
const { newProjectTasks } = require("../task_lists/init_newProject_tasks");
const { existingProjectTasks } = require("../task_lists/init_existingProject_tasks");
const fs = require('fs-extra');
const git = require('simple-git/promise');
const axios = require('axios');


/* ******************************** MAIN LOGIC **************************************** */

async function init(server,args) {
    const projectName = "server_"+server;

    if( projectPathOkFor(projectName) && await notInsideGitRepo() && await validCobServer(server)) {

        let tasks;
        if(await projectExistsInGitlab(projectName,args) ) {
            if(await noLegacyOption(args.legacy)) {
                tasks = existingProjectTasks(projectName, args);
            }
        } else {
            tasks = newProjectTasks(server, args)
        }
        
        tasks && tasks
            .run()
            .then( () => {
                console.log(colors.green("\nDone!"), "\nTry:");
                console.log("\tcd server_"+server)
                console.log("\tcob-cli customize\n")
            })
            .catch(err => {
                console.error("\n",err.message);
            })
    }  
}
module.exports = init;

/* *************************** PRE EXECUTION VALIDATIONS ********************************** */

function projectPathOkFor(projectName) {
    let pathExist = fs.pathExistsSync(projectName);
    if(!pathExist) return true
    console.log(colors.red("\nError:"), "directory", colors.blue(colors.italic(projectName)) ,"already exists.\n" );
}

async function notInsideGitRepo() {
    let isRepo = await git().checkIsRepo()
    if(!isRepo) return true
    console.log(colors.red("\nError:"),"current directory is part of a repository git.\n");
}

async function validCobServer(server) {
    var result; 
    try {
        result = await axios.get("https://"+server+".cultofbits.com/health")
    } catch {}
    
    if(result && result.status == "200") return true
    console.log(colors.red("\nError:"),colors.blue(colors.bold(server+".cultofbits.com")), "is not a valid CoB server.\n");
}

async function noLegacyOption(legacy) {
    if(!legacy) return true
    console.log(colors.red("\nError:"),"'--legacy' is an invalid option for an already existing repositories\n" );
}

/* ******************************** DECISION TESTS **************************************** */

async function projectExistsInGitlab(projectName, args) {
    let projectExists = true;
    try {
        await git().silent(true).listRemote(args.repoaccount + projectName);
    } catch {
        projectExists = false;
    }
    return projectExists;
}

/* ************************************************************************ */