const SERVER_COB_CLI_DIRECTORY = "/opt/cob-cli";

/* **************************************************************************************** */
async function checkWorkingCopyCleanliness() {
    const git = require('simple-git/promise');
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
    return execa('ssh', ["-o", "StrictHostKeyChecking=no", "-o", "PreferredAuthentications=publickey", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", server, "test -w /etc/recordm/recordm.rc && exit || exit 1"])
}

/* ************************************ */
function getServerName() {
    const fs = require('fs-extra');
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
    const readline = require('readline');

    process.stdin.setRawMode(true);
    readline.emitKeypressEvents(process.stdin);
    const rl = readline.createInterface({
        input: process.stdin
    });
    return new Promise(resolve => rl.input.on("keypress", (letter,key) => {
        if(key.name == "return") {
            console.log("")
        } else {
            if(key.ctrl && key.name == 'c') letter = "ctrl+c"
            rl.close();
            resolve(letter && letter.toLowerCase() || key.name);
        }
    }))
}

async function sudo(server, commands=[], observer){
    const askpassword = require('askpassword');
    const execa = require('execa');

    const maxAttempts = 3;
    let attempt = 1;

    while(attempt <= maxAttempts){
        try {
            const passwdInputMsg = `[ATTEMPT ${attempt}/${maxAttempts}] Password for 'sudo':`;

            if(observer && typeof observer.next === "function"){
                observer.next(passwdInputMsg);
            } else{
                console.log(passwdInputMsg);
            }

            const password = (await askpassword(process.stdin)).toString();

            const sudoExec = await execa("ssh", [server, `sudo --stdin ${commands.join(" && sudo ")}`],
                {input: `${password}\n`, stdio:'pipe'}); // add a \n to the password to emulate its end

            return Promise.resolve();
        } catch(e){
            if(e.stderr.includes("no password was provided")
               || e.stderr.includes("password attempt")
               || e.stderr.includes("Sorry")
               || e.stderr.includes("a password is required")){
                attempt++;
            } else{
                console.error("Error executing commands with 'sudo'", commands, e);
                return Promise.reject(new Error("Error executing commands with 'sudo'"));
            }
        }
    }

    return Promise.reject(new Error("Too many failed 'sudo' attempts, aborting..."));
}

/* ************************************ */
module.exports = {
    SERVER_COB_CLI_DIRECTORY : SERVER_COB_CLI_DIRECTORY,
    checkConnectivity: checkConnectivity,
    checkWorkingCopyCleanliness: checkWorkingCopyCleanliness,
    getServerName: getServerName,
    getServer: getServer,
    getKeypress: getKeypress,
    sudo: sudo
};
