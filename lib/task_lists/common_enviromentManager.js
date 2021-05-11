require('colors');
const fg = require('fast-glob');
const fs = require('fs');
const { env } = require('process');
const { getCurrentBranch } = require("./common_releaseManager");

/* ************************************ */
async function getEnviroment(args) {
    const environmentName = args.environment ? args.environment : "prod";
    const servername = args.servername ? args.servername : getServerName(environmentName);
    const server = getServer(servername)

    let defaultserver = getServer(getServerName("prod"));
    let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";

    let currentBranch = await getCurrentBranch();
    let branchStr = currentBranch == "master" ? "master".bold.blue : currentBranch.bgRed ;

    return {
        name: environmentName,
        serverName: servername,
        server: server,
        serverStr: serverStr,
        currentBranch: currentBranch,
        branchStr: branchStr,
        applySpecific: applySpecific,
        undoSpecific: undoSpecific
    }
}
exports.getEnviroment = getEnviroment;


/* ************************************ */
async function applySpecific() {
    const envSpecificFiles = await fg(['**/*.ENV__'+ this.name +'__.*'], { onlyFiles: false, dot: true });
    envSpecificFiles.forEach( specificFile => {
        let backupFile = specificFile.replace(/\.ENV__.*__/,".ENV__ORIGINAL__")
        let deleteFile = specificFile.replace(/\.ENV__.*__/,".ENV__DELETE__")
        let prodFile   = specificFile.replace(/\.ENV__.*__/,"")
        if(fs.existsSync(prodFile)) {
            fs.renameSync(prodFile, backupFile, function (err) {
                if (err) throw err
            })
        } else {
            fs.closeSync(fs.openSync(deleteFile, 'w'));
        }
        fs.renameSync(specificFile, prodFile, function (err) {
            if (err) throw err
        })
    })
}

/* ************************************ */
async function undoSpecific() {
    const changedFiles = await fg(['**/*.ENV__ORIGINAL__.*', '**/*.ENV__DELETE__.*'], { onlyFiles: false, dot: true });
    changedFiles.forEach( changedFile => {
        let isBackupFile = changedFile.indexOf("\.ENV__ORIGINAL__")
        let isDeleteFile = changedFile.indexOf("\.ENV__DELETE__")
        let prodFile     = changedFile.replace(/\.ENV__.*__/,"")
        let specificFile = changedFile.replace(/\.ENV__.*__/,'.ENV__'+this.name+'__')

        fs.renameSync(prodFile, specificFile, function (err) {
            if (err) throw err
        })    
        
        if(isBackupFile) {
            fs.renameSync(changedFile, prodFile, function (err) {
                if (err) throw err
            })    
        } else if( isDeleteFile) {
            fs.unlinkSync(deleteFile)
        }
    })
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

