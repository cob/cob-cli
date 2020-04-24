const colors = require('colors');
const { newProject } = require("../tasks/init_newProject");
const { legacyProject } = require("../tasks/init_legacyProject");
const { existingProject } = require("../tasks/init_existingProject");
const git = require('simple-git/promise');
const axios = require('axios');


/* ******************************** MAIN LOGIC **************************************** */

async function init(server,args) {
    const projectName = "server_"+server;

    if( projectPathOkFor(projectName) && await notInsideGitRepo() && await validCobServer(server)) {

        let tasks;
        if(await projectExistsInGitlab(projectName) ) {
            tasks = existingProject(projectName, args);
        } else if( args.legacy ) {
            tasks = legacyProject(server, args);
        } else {
            tasks = newProject(server)
        }
        
        tasks && tasks.run()
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

/* ****************************** PRE VALIDATIONS TESTS ****************************************** */

function projectPathOkFor(projectName) {
    let pathExist = fs.pathExistsSync(projectName);
    if(!pathExist) return true
    console.log(colors.yellow("\nWarning:"), colors.blue(colors.bold("./"+projectName)) ,"already exists. Doing nothing.\n" );
}

async function notInsideGitRepo() {
    let isRepo = await git().checkIsRepo()
    if(!isRepo) return true
    console.log(colors.red("\nError:"),"current directory is already part of a repository.\n");
}

async function validCobServer(server) {
    var result; 
    try {
        result = await axios.get("https://"+server+".cultofbits.com/health")
    } catch {}
  
    if(result && result.status == "200") return true
    console.log(colors.red("\nError:"),colors.blue(colors.bold(server+".cultofbits.com")), "is not a valid CoB server.\n");
}

/* ******************************** DECISION TESTS**************************************** */

async function projectExistsInGitlab(projectName) {
    let projectExists = true;
    try {
        await git().silent(true).listRemote([],"https://gitlab.com/mimes70/"+projectName);
    } catch {
        projectExists = false;
    }
    return projectExists;
}

/* ************************************************************************ */