require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const path = require('path');
const { checkWorkingCopyCleanliness } = require("../task_lists/common_helpers");
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");

const Legacy0Filename = '.server'
const Legacy1Filename = 'environments/prod/server'
const VersionFilename = '.version'
const REPO_VERSION = "201" // por convenção deverá ser actualizado com versionStr2Number( require('../../package.json').version ) sempre que necessário, tendo depois a função necessária para fazer o upgrade
const versionStr2Number = (versionStr) => (versionStr === REPO_VERSION)
                                          ? versionStr
                                          : versionStr.split(".").slice(0,-1).reduce( (x,y) => Number(x)*100+Number(y))

async function upgradeRepo() {
    console.log("Checking conditions to upgrade cob-cli repo");
    try {
        await new Listr([
            {   title: "Get repo Version",                                                                    task: ctx => ctx.version = _getRepoVersion() },
            {   title: "cob-cli repo files not found",         enabled: ctx => ctx.version == 9999,           task: ()  => {throw new Error("Error:".red + " not on a root of a cob-cli repo. Check your path. \n")} },
            {   title: "Found old cob-cli",                    enabled: ctx => ctx.version > REPO_VERSION, task: ()  => {throw new Error("Error:".red + " update cob-cli version. Please update via npm \n")} },
            {   title: "Nothing todo",                         enabled: ctx => ctx.version == REPO_VERSION,task: ()  => {throw new Error("Warn:".yellow + " nothing todo. Version up to date. \n")} },
            {   title: "Check git status",                     enabled: ctx => ctx.version < REPO_VERSION, task: ()  => checkWorkingCopyCleanliness() }, 
            {   title: "Upgrade 0 to 1".bold,                  enabled: ctx => ctx.version < 1,               task: ()  => _upgrade0to1() },
            {   title: "Upgrade 1 to 2".bold,                  enabled: ctx => ctx.version < 2,               task: ()  => _upgrade1to2() },
            {   title: "Upgrade 2.0 to 2.1".bold,              enabled: ctx => ctx.version < 201,             task: ()  => _upgrade2to2_1() }
        ]).run()

        console.log("\nDone".green, "\Upgrade successfull. Please commit your changes after reviewing them.\n");

    } catch(err) {
        console.error("\n",err.message);
    } 
}
exports.upgradeRepo = upgradeRepo;

/* ************************************ */
function checkVersion() {
    let repoVersion = _getRepoVersion();
    if(repoVersion == 9999 ) {
        throw new Error("Error:".red + " not on a root of a cob-cli repo. Check your path. \n")
    }

    if(repoVersion > REPO_VERSION ) {
        throw new Error("Error:".red + " your cob-cli tool is outdated. Run " + "npm update -g cob-cli".bold.blue + "\n")
    }    
    
    if(repoVersion < REPO_VERSION) {
        throw new Error("Error:".red + " your cob-cli repo is outdated. Run " + "cob-cli upgradeRepo".bold.blue + "\n")
    }
}
exports.checkVersion = checkVersion;

/* ************************************ */
function setVersion() {
    fs.writeFileSync(VersionFilename, REPO_VERSION)
}
exports.setVersion = setVersion;

/* ************************************ */
function _getRepoVersion() {
    try { 
        return versionStr2Number( fs.readFileSync(VersionFilename, 'utf8') )
    } catch { 
        try {
            fs.readFileSync(Legacy1Filename, 'utf8')
            return 1
        } catch { }

        try {
            fs.readFileSync(Legacy0Filename, 'utf8')
            return 0
        } catch { }

        return 9999
    }
}

/* ************************************ */
async function _upgrade0to1() {
    const cmdEnv = await getCurrentCommandEnviroment({}, fs.readFileSync(Legacy0Filename, 'utf8'))
    fs.unlinkSync(Legacy0Filename)
    await cmdEnv.initialize()
}

/* ************************************ */
function _upgrade1to2() {
    if(REPO_VERSION == 2) {
        // If current version is still 2.x.x set the precise version using regular _setVersion
        setVersion()
    } else {
        // Otherwise set a generic 2 version only for next step on the upgrade process
        fs.writeFileSync(VersionFilename, "2.x.x")
    }
}

/* ************************************ */
function _upgrade2to2_1() {
    fs.writeFileSync(".gitignore", fs.readFileSync(path.resolve(__dirname,"../../templates/gitignore"), 'utf8'))
    setVersion()
}