require('colors');
const execa = require('execa');
const fg = require('fast-glob');
const git = require('simple-git/promise');
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

    let serverStr = servername == defaultEnvironmentServerName ? server.bold.blue : server.bold.bgRed + " (default for " + environmentName.bold.blue + " is " + defaultEnvironmentServerName.bold.blue + ")";
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
        initialize:                                    async () => await _setupEnvironment(environmentName, servername, server),
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
        let deleteFile = envSpecificFile.replace(/\.ENV__.*__/,".ENV__DELETE__")
        if(!fs.existsSync(deleteFile)) {
            if(fs.existsSync(prodFile)) {
                let backupFile = envSpecificFile.replace(/\.ENV__.*__/,".ENV__ORIGINAL_BACKUP__")
                await git().raw(["update-index","--assume-unchanged", prodFile])
                fs.renameSync(prodFile, backupFile)
            } else {
                fs.appendFileSync('.git/info/exclude', "\n" + prodFile)
                fs.closeSync(fs.openSync(deleteFile, 'w'));
            }
        }
        fs.renameSync(envSpecificFile, prodFile)
        await git().raw(["update-index","--assume-unchanged", envSpecificFile])
    }
}

/* ************************************ */
async function _undoSpecific(environmentName) {
    let changedFiles = await fg(['**/*.ENV__ORIGINAL_BACKUP__.*', '**/*.ENV__DELETE__.*'], { onlyFiles: false, dot: true });
    let flagDeleteExclude = false;
    for( let changedFile of changedFiles ) {
        let prodFile = changedFile.replace(/\.ENV__.*__/,"")
        let originalEnvSpecificFile = changedFile.replace(/\.ENV__.*__/,'.ENV__' + environmentName + '__')
        fs.renameSync(prodFile, originalEnvSpecificFile)
        await git().raw(["update-index","--no-assume-unchanged", originalEnvSpecificFile])
        
        if( changedFile.indexOf("\.ENV__ORIGINAL_BACKUP__") > 0 ) {
            fs.renameSync(changedFile, prodFile)
            await git().raw(["update-index","--no-assume-unchanged", prodFile])
        }
        if( changedFile.indexOf("\.ENV__DELETE__")  > 0 ) {
            flagDeleteExclude = true
            fs.unlinkSync(changedFile)
        }
    }
    if(flagDeleteExclude) fs.unlinkSync(".git/info/exclude")
}

/* ************************************ */
function _getDefaultServerForEnvironment(environmentName) {
    const filename = 'environments/' + environmentName + '/server'
    try {
        return fs.readFileSync(filename, 'utf8')
    } catch {
        throw new Error("\nError: ".red + filename.blue.bold + " not found.\n");
    }
}

/* ************************************ */
function _getServerFQDN(servername) {
    return servername + ".cultofbits.com";
}

/* ************************************ */
async function _getLastEnvironmentDeployed(server) {
    try {
        let result = await execa('ssh', [server, "cat " + SERVER_LAST_ENV_FILE ]);
        return result.stdout;
    } catch (error) {
        return "prod"
    }
}

/* ************************************ */
async function _setLastEnvironmentDeployed(server, environmentName) {
    await execa('ssh', [server, "echo '" + environmentName + "' > " + SERVER_LAST_ENV_FILE ]);
}

/* ************************************ */
async function _setupEnvironment(environmentName, servername, server) {
    await fs.mkdirs("environments/" + environmentName);
    await fs.writeFile("environments/" + environmentName + "/server", servername);
}