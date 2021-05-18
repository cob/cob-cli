require('colors');
const execa = require('execa');
const fg = require('fast-glob');
const fs = require('fs-extra');
const { getCurrentBranch } = require("./common_releaseManager");
const { SERVER_COB_CLI_DIRECTORY } = require("./common_helpers")

const SERVER_LAST_ENV_FILE = SERVER_COB_CLI_DIRECTORY + "lastDeployEnv";


/* ************************************ */
async function getCurrentCommandEnviroment(args, newServername) {
    const environmentName = args.environment ? args.environment : "prod";

    const defaultEnvironmentServerName = newServername ? newServername : _getDefaultServerForEnvironment(environmentName);
    const servername = args.servername ? args.servername : defaultEnvironmentServerName;
    const server = _getServerFQDN(servername)
    const currentBranch = newServername ? "master" : await getCurrentBranch();

    const lastEnvironmentDeployedToServer = await _getLastEnvironmentDeployed(server)

    let serverStr = servername == defaultEnvironmentServerName ? server.bold.blue : server.bold.bgRed + " (default for " + environmentName + " is " + defaultEnvironmentServerName.bold.blue + ")";
    let branchStr = currentBranch == "master" ? "master".bold.blue : currentBranch.bgRed ;


    let products = []
    try { 
        var data = fs.readFileSync('environments/' + environmentName + '/products', 'utf8'); 
        products = data.split("\n").filter(p => p)
    } catch { }


    let rsyncFilter = 'environments/' + environmentName + '/rsyncFilter.txt'
    try { 
        fs.lstatSync(rsyncFilter).isFile() 
    } catch { 
        rsyncFilter = ""
    }

    //TODO: Confirmar se quer prosseguir se:
    // * server          != defaultServer for environment
    // * currentBranch   != brach of lastDeployedSha
    // * environmentName != lastEnvironmentDeployedToServer
    
    return {
        name: environmentName,
        servername: servername,
        server: server,
        serverStr: serverStr,
        currentBranch: currentBranch,
        branchStr: branchStr,
        products: products,
        rsyncFilter: rsyncFilter,
        initialize:                                    () => _setupEnvironment(environmentName, servername, server),
        applyLastEnvironmentDeployedToServerChanges:   () => _applySpecific(lastEnvironmentDeployedToServer),
        unApplyLastEnvironmentDeployedToServerChanges: () => _undoSpecific(lastEnvironmentDeployedToServer),
        applyCurrentCommandEnvironmentChanges:         () => _applySpecific(environmentName),
        unApplyCurrentCommandEnvironmentChanges:       () => _undoSpecific(environmentName),
        setLastEnvironmentDeployed:                    () => _setLastEnvironmentDeployed(server, environmentName)
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
function _getDefaultServerForEnvironment(environmentName) {
    const filename = 'environments/' + environmentName + '/server'
    try {
        var data = fs.readFileSync(filename, 'utf8')
        return data
    } catch {
        if(environmentName == "prod" ) {
            const legacyFilename = '.server'
            try {
                var data = fs.readFileSync(legacyFilename, 'utf8')
                _setupEnvironment("prod", data, _getServer(data))
                fs.unlinkSync('.server')
                return data
            } catch { }
        }
        throw new Error("\nError: ".red + filename.blue.bold + " not found. This command should be run inside a CoB project directory.\n");
    }
}

/* ************************************ */
function _getServerFQDN(servername) {
    return servername + ".cultofbits.com";
}

/* ************************************ */
async function _getLastEnvironmentDeployed(server) {
    let result
    try {
        result = await execa('ssh', [server, "cat " + SERVER_LAST_ENV_FILE ]);
    } catch (error) { 
        return "prod"
    }
    return result.stdout;
}

/* ************************************ */
async function _setLastEnvironmentDeployed(server, environmentName) {
    await execa('ssh', [server, "mkdir -p " + SERVER_COB_CLI_DIRECTORY ]); //TODO: remove after new sudo mkdir 
    await execa('ssh', [server, "echo '" + environmentName + "' > " + SERVER_LAST_ENV_FILE ]);
}

/* ************************************ */
function _setupEnvironment(environmentName, servername, server) {
    fs.mkdirs("environments") 
    fs.mkdirs("environments/" + environmentName) 
    fs.writeFile("environments/" + environmentName + "/server", servername)
    _setLastEnvironmentDeployed(server, environmentName)
}