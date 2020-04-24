const colors = require('colors');
const { newProject } = require("../tasks/init_newProject");
const { legacyProject } = require("../tasks/init_legacyProject");
const { existingProject } = require("../tasks/init_existingProject");
const fs = require('fs-extra');
const git = require('simple-git/promise');
const axios = require('axios');


/* ************************************************************************ */

async function init(server) {
    const projectName = "server_"+server;

    if( projectPathOkFor(projectName) && await notInsideGitRepo() && await validCobServer(server)) {

        console.log("\nInitiating", colors.blue(colors.bold(projectName)) , "customization project directory:" );
        
        let tasks;
        if( await projectExistsInGitlab(projectName) ) {
            console.log("\Clonning ", colors.blue(colors.bold(projectName)) , "from gitlab" );
            tasks = existingProject(server);

        } else if( await projectExistsInClientconfs(projectName) ) {
            console.log("\Using legacy clientconf ", colors.blue(colors.bold(server)) , "from github" );
            tasks = legacyProject(server);
            
        } else {
            console.log("\Creating new project", colors.blue(colors.bold(server)) , "on gitlab" );
            tasks = newProject(server)

        }
        
        tasks.run()
        .catch(err => {
            console.error("Initialization of",  colors.blue(colors.bold(projectName)) ,"aborted:\n",err.message);
        })
        .finally( () => {
            console.log("\nDone. Try:");
            console.log("\tcd server_"+server)
            console.log("\tcob-cli test\n")
        })
    }  
}
module.exports = init;

/* ************************************************************************ */

function projectPathOkFor(projectName) {
    return  true;
    let pathExist = fs.pathExistsSync(projectName);
    if(!pathExist) return true
    console.log(colors.red("\nError:"),"path", colors.blue(colors.bold("./"+projectName)) ,"already exists.\n" );
}

async function notInsideGitRepo() {
    return  true;
    let isRepo = await git().checkIsRepo()
    if(!isRepo) return true
    console.log(colors.red("\nError:"),"current directory is already part of a repostitory.\n");
}

async function validCobServer(server) {
    var result; 
    try {
        result = await axios.get("https://"+server+".cultofbits.com/health")
    } catch {}
  
    if(result && result.status == "200") return true
    console.log(colors.red("\nError:"),colors.blue(colors.bold(server+".cultofbits.com")), "is not a valid CoB server.\n");
}

/* ************************************************************************ */

async function projectExistsInGitlab(projectName) {
    let projectExists = true;
    try {
        await git().listRemote("https://gitlab.com/mimes70/"+projectName);
    } catch {
        projectExists = false;
    }
    return projectExists;
}

async function projectExistsInClientconfs(server) {
    let projectExists = true;
    let x
    try {
        x = await git()
            .checkout("master -- /galp2 ","https://github.com/cob/ClientConfs.git")
    } catch (err) {
        projectExists = false;
    }
    return projectExists;
}

/* ************************************************************************ */