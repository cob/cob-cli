require('colors');
const { newProjectTasks } = require("../task_lists/init_newProject");
const { existingProjectTasks } = require("../task_lists/init_existingProject");
const {  getServer } = require("../task_lists/helpers");
const fs = require('fs-extra');
const axios = require('axios');
const git = require('simple-git/promise');


/* ******************************** MAIN LOGIC **************************************** */

async function init(servername,args) {
    const projectName = "server_"+servername;
    const server = getServer(servername)
    const repo = args.repoaccount + (args.repoaccount.slice(-1) == "/" ? "" : "/")  + projectName;

    if( projectPathOkFor(projectName) && await notInsideGitRepo() && await validCobServer(server)) {

        let initTasks;
        if(await projectExistsInGitAccount(projectName,args.repoaccount) ) {
            if(args.legacy) {
                console.log("\nError:".red + " '--legacy' is an invalid option for an already existing repositories\n")
                return
            } else {
                console.log("\nGetting project", repo.bold.blue, ":" );
                initTasks = existingProjectTasks(repo);
            }
        } else {
            console.log("\nCreating project", projectName.bold.blue );
            initTasks = newProjectTasks(servername, server, projectName, repo, args )
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
    console.log("\nError:".red, server.blue.bold, "is not a valid CoB server.\n");
}

/* ************************************ */
async function projectExistsInGitAccount(projectName, repoaccount) {
    try {
        await git().silent(true).listRemote(repoaccount + projectName);
        return true;
    } catch {}
}

/* ************************************ */
// Tests:
// cob-cli init servername                          -> 1) should produce a initialized CHANGELOG, 2) should not allow further unstandard commit messages
// cob-cli init servername   (existing project)     -> should just get project and setup .git/hooks
// cob-cli init servername --legacy                 -> 1) should only have the relevant commits, 2) old commit should have date near the hash (under miscellaneous)
// cob-cli init servername --repoaccount            -> should create under specified account 

// cob-cli init servername -l (existing project)    -> should fail
// cob-cli init servername (inside git dir)         -> should fail
// cob-cli init servername (existing dir)           -> should fail
// cob-cli init servername (invalid server)         -> should fail