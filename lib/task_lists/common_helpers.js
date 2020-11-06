const Listr = require('listr');
const execa = require('execa');
require('path');
const fs = require('fs-extra');
const git = require('simple-git/promise');
const readline = require('readline');

const SERVER_COB_CLI_DIRECTORY = "/opt/cob-cli/";

/* **************************************************************************************** */
async function checkWorkingCopyCleanliness() {
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
    return execa('ssh', ["-o", "StrictHostKeyChecking=no", "-o", "PreferredAuthentications=publickey", server, "test -w /etc/recordm/recordm.rc && exit || exit 1"])
}

/* ************************************ */
function getServerName() {
    try {
        var data = fs.readFileSync('.server', 'utf8');
        return data;
    } catch {
        throw new Error("\nError:".red + " file " + ".server".blue.bold + " not found. This command should be run inside project directory.\n" )
    }
}

/* ************************************ */
function getServer(serverName) {
    return serverName + ".cultofbits.com";
}

/* ************************************ */
function getKeypress() {
    process.stdin.setRawMode(true);
    readline.emitKeypressEvents(process.stdin);
    const rl = readline.createInterface({
        input: process.stdin
    });
    return new Promise(resolve => rl.input.on("keypress", (letter,key) => {
        if(key.name == "return") {
            console.log("")
        } else {
        rl.close();
            resolve(letter && letter.toLowerCase() || key.name);
        }
    }))
}

/* ************************************ */
module.exports = {
    SERVER_COB_CLI_DIRECTORY : SERVER_COB_CLI_DIRECTORY,
    checkConnectivity: checkConnectivity,
    checkWorkingCopyCleanliness: checkWorkingCopyCleanliness,
    getServerName: getServerName,
    getServer: getServer,
    getKeypress: getKeypress
};
