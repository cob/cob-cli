require('colors');
const fg = require('fast-glob');
const fs = require('fs');
const { getCurrentBranch } = require("./common_releaseManager");

/* ************************************ */
async function getCurrentCommandEnviroment(args) {
    const environmentName = args.environment ? args.environment : "prod";
    const defaultEnvironmentServerName = getServerName(environmentName);
    const servername = args.servername ? args.servername : defaultEnvironmentServerName;
    const server = getServer(servername)
    const currentBranch = await getCurrentBranch();

    const lastEnvironmentDeployedToServer = _getLastEnvironmentDeployed()

    let serverStr = servername == defaultEnvironmentServerName ? server.bold.blue : server.bold.bgRed + " (default for " + environmentName + " is " + defaultEnvironmentServerName.bold.blue + ")";
    let branchStr = currentBranch == "master" ? "master".bold.blue : currentBranch.bgRed ;


    return {
        name: environmentName,
        serverName: servername,
        server: server,
        serverStr: serverStr,
        lastEnvironmentDeployedToServer: lastEnvironmentDeployedToServer,
        currentBranch: currentBranch,
        branchStr: branchStr,
        applyLastEnvironmentDeployedToServerChanges: () => _applySpecific(lastEnvironmentDeployedToServer),
        unApplyLastEnvironmentDeployedToServerChanges: () => _undoSpecific(lastEnvironmentDeployedToServer),
        applyCurrentCommandEnvironmentChanges: () => _applySpecific(environmentName),
        unApplyCurrentCommandEnvironmentChanges: () => _undoSpecific(environmentName),
        getLastEnvironmentDeployed: _getLastEnvironmentDeployed,
        setLastEnvironmentDeployed: _setLastEnvironmentDeployed
    }
}
exports.getCurrentCommandEnviroment = getCurrentCommandEnviroment;

/* ************************************ */
async function _applySpecific(environmentName) {
    const envSpecificFiles = await fg(['**/*.ENV__'+ environmentName +'__.*'], { onlyFiles: false, dot: true });
    for( let envSpecificFile of envSpecificFiles ) {
        let prodFile   = envSpecificFile.replace(/\.ENV__.*__/,"")
        if(fs.existsSync(prodFile)) {
            let backupFile = envSpecificFile.replace(/\.ENV__.*__/,".ENV__ORIGINAL_BACKUP__")
            fs.renameSync(prodFile, backupFile)
        } else {
            let deleteFile = envSpecificFile.replace(/\.ENV__.*__/,".ENV__DELETE__")
            fs.closeSync(fs.openSync(deleteFile, 'w'));
        }
        fs.renameSync(envSpecificFile, prodFile)
    }
}

/* ************************************ */
async function _undoSpecific(environmentName) {
    let changedFiles = await fg(['**/*.ENV__ORIGINAL_BACKUP__.*', '**/*.ENV__DELETE__.*'], { onlyFiles: false, dot: true });
    for( let changedFile of changedFiles ) {        
        let prodFile = changedFile.replace(/\.ENV__.*__/,"")
        let originalEnvSpecificFile = changedFile.replace(/\.ENV__.*__/,'.ENV__' + environmentName + '__')
        fs.renameSync(prodFile, originalEnvSpecificFile)
        
        if( changedFile.indexOf("\.ENV__ORIGINAL_BACKUP__") > 0 ) {
            fs.renameSync(changedFile, prodFile)    
        }
        if( changedFile.indexOf("\.ENV__DELETE__")  > 0 ) {
            fs.unlinkSync(changedFile)    
        }
    }
}


/* ************************************ */
function getServerName(environmentName) {
    const fs = require('fs-extra');
    const filename = 'environments/' + environmentName + '/server'
    try {
        var data = fs.readFileSync(filename, 'utf8');
        return data;
    } catch {
        throw new Error("\nError:".red + " file " + filename.blue.bold + " not found. This command should be run inside project directory.\n");
    }
}

/* ************************************ */
function getServer(serverName) {
    return serverName + ".cultofbits.com";
}
exports.getServer = getServer;


/* ************************************ */

const {  } = require("./common_helpers");

const SERVER_LAST_ENV_FILE = require("./common_helpers").SERVER_COB_CLI_DIRECTORY + "lastDeployEnv";

/* ************************************ */
async function _getLastEnvironmentDeployed() {
    let result
    try {
        result = await execa('ssh', [server, "cat " + SERVER_LAST_ENV_FILE ]);
    } catch (error) { 
        return "prod"
    }
    return result.stdout;

}

/* ************************************ */
function _setLastEnvironmentDeployed(server) {
    execa('ssh', [server, "echo '" + this.environmentName + "' > " + SERVER_LAST_ENV_FILE ]);
}
