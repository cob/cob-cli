const inquirer = require("inquirer")
const readline = require('readline');
const yaml = require('js-yaml');
const fs = require("fs/promises");

const SERVER_COB_CLI_DIRECTORY = "/opt/cob-cli/";

/* **************************************************************************************** */
async function checkWorkingCopyCleanliness(testNotDetached=true) {
    const git = require('simple-git');
    //Check we're not detached
    if(testNotDetached) await git().revparse(["--abbrev-ref", "HEAD"]).then( currentBranch => { if(!currentBranch) throw new Error("Aborded:".red + " git head is dettached")} ) 
    await git().fetch()
    await git().status()
    .then(result => {
        // resultSample = {"not_added":[".server"],"conflicted":[],"created":[],"deleted":[],"modified":["a.js"],"renamed":[],"files":[{"path":"a.js","index":" ","working_dir":"M"},{"path":".server","index":"?","working_dir":"?"}],"staged":[],"ahead":0,"behind":0,"current":"test","tracking":"origin/test"}
        if (!result.isClean() || result.behind) {
            let errors = ["Please clean your working tree before deploy:"];

            if(result.behind) {
                errors.push( "\t You're behind of origin on this branch by " + result.behind + " commits")
                errors.push( "\t Consider doing a " + "git pull".brightBlue)
            }
            if(result.files.length) {
                errors.push(" Commit or stash your changes:");
                result.files.forEach( file => {
                    errors.push( "\t " + file.working_dir + " " + file.index + " " + file.path )
                })
            }
            errors.push("Error:".bgRed + " Unclean working tree")
            throw new Error(errors.join("\n"))
        }
    })
}

/* ************************************ */
function checkConnectivity(server) {
    const execa = require('execa');
    return execa('ssh', [
        "-o", "StrictHostKeyChecking=no",
        "-o", "PreferredAuthentications=publickey",
        "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=15",
        server,
        "test -w /etc/recordm/services/com.cultofbits.web.integration.properties && exit || exit 1"
    ])
}


/* ************************************ */
let readlineSetup = false
function getKeypress() {
    if (!readlineSetup) {
        readline.emitKeypressEvents(process.stdin);
        readlineSetup = true
    }
    process.stdin.setRawMode(true);
    const rl = readline.createInterface({
        input: process.stdin
    });
   
    return new Promise(resolve => {
        const listener = function(letter,key){
            if(key.name == "return") {
                console.log("")

            } else {
                if(key.ctrl && key.name == 'c') letter = "ctrl+c"
                rl.input.removeListener('keypress', listener)
                rl.close();
                process.stdin.setRawMode(false);
                resolve(letter && letter.toLowerCase() || key.name);
            }
        }
        rl.input.on("keypress", listener)
    })
}

/* ************************************ */
async function promptCredentials() {
    const answers = await inquirer.prompt([
        {
            type: 'text',
            message: 'Enter username:',
            name: 'username',
        },
        {
            type: 'password',
            message: 'Enter password:',
            name: 'password',
            mask: '*',
        },
    ])

    return answers
};

/* ************************************ */
async function readYamlFile(filename) {
    try {
        const data = await fs.readFile(filename, 'utf-8');
        const config = yaml.load(data);
        return config
    } catch (error) {
        console.error('Error reading YAML file:', error.message);
    }
}

/* ************************************ */
module.exports = {
    SERVER_COB_CLI_DIRECTORY : SERVER_COB_CLI_DIRECTORY,
    checkConnectivity: checkConnectivity,
    checkWorkingCopyCleanliness: checkWorkingCopyCleanliness,
    getKeypress: getKeypress,
    promptCredentials: promptCredentials,
    readYamlFile: readYamlFile
};
