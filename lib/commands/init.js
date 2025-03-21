require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { newProjectTasks } = require("../task_lists/init_newProject");
const fs = require('fs-extra');
const axios = require('axios');
const git = require('simple-git');
const https = require('https');


/* ******************************** MAIN LOGIC **************************************** */
async function init(servername,args) {
    const cmdEnv = await getCurrentCommandEnviroment(args,servername)
    const projectName = "server_"+cmdEnv.servername;
    const repo = args.repoaccount + (args.repoaccount.slice(-1) == "/" ? "" : "/")  + projectName;
    
    let initTasks;
    if(await projectExistsInGitAccount(projectName,args.repoaccount) ) {
        console.log("\nRepo cloned!".green);
    } else if( projectPathOkFor(projectName) && await notInsideGitRepo() && await validCobServer(cmdEnv.serverHTTPs)) {
        console.log("\nCreating project", projectName.bold.blue );
        initTasks = newProjectTasks(cmdEnv, projectName, repo, args )
        initTasks.run()
        .then( () => {
            console.log("\nDone!".green, "\nTry:");
            console.log("\tcd "+projectName)
            console.log("\tcob-cli customize\n")
        })
        .catch(err => {
            console.error("\n",err.message);
        })    
    } else {
        return //Error
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
    let isRepo = false
    try {
        isRepo = await git().checkIsRepo()
    } catch {}

    if(!isRepo) return true
    console.log("\nError:".red,"current directory is part of a repository git.\n");
}

/* ************************************ */
async function validCobServer(server) {
    var result; 
    try {
        // At request level
        const agent = new https.Agent({  
            rejectUnauthorized: false
        });
        result = await axios.get("https://"+server+"/health", { httpsAgent: agent })
    } catch {}
    
    if(result && result.status == "200") return true
    console.log("\nError:".red, server.blue.bold, "is not a valid CoB server. Failed to get cob-health.\n");
}

/* ************************************ */
async function projectExistsInGitAccount(projectName, repoaccount) {
    try {
        let cloneConfs = []
        if(process.platform === 'win32'){
            // on windows we force the usage of lf as line-endings
            // so that rsync doesn't think all files have changed
            cloneConfs = [
                '--config', 'core.autocrlf=input',
                '--config',  'core.eol=lf' 
            ]
        }
        await git().clone(repoaccount + projectName, cloneConfs);
        return true;
    } catch (e) {
        return false
    }
}
