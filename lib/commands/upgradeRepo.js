require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const path = require('path');
const git = require('simple-git/promise');
const { getCurrentBranch } = require("../task_lists/common_releaseManager");
const { checkWorkingCopyCleanliness } = require("../task_lists/common_helpers");
const { setupEnvironment } = require("../task_lists/common_enviromentHandler");

const CURRENT_VERSION = 3

async function upgradeRepo() {
    console.log("Checking conditions to upgrade cob-cli repo" );
    try {
        await new Listr([
            {   title: "Get current Version of repo".bold,                                                    task: ctx => ctx.version = getCurrentVersion() },
            {   title: "cob-cli repo files not found",         enabled: ctx => ctx.version == 9999,           task: ()  => {throw new Error("Error:".red + " not on a root of a cob-cli repo. Check your path. \n")} },
            {   title: "Found old cob-cli",                    enabled: ctx => ctx.version > CURRENT_VERSION, task: ()  => {throw new Error("Error:".red + " update cob-cli version. Please update via npm \n")} },
            {   title: "Nothing todo",                         enabled: ctx => ctx.version == CURRENT_VERSION,task: ()  => {throw new Error("Warn:".yellow + " nothing todo. Version up to date. \n")} },
            {   title: "Check HEAD is not dettached".bold,     enabled: ctx => ctx.version < CURRENT_VERSION, task: ()  => getCurrentBranch().then( currentBranch => { if(!currentBranch) throw new Error("Aborded:".red + " git head is dettached")} ) }, 
            {   title: "Update with origin: git fetch origin", enabled: ctx => ctx.version < CURRENT_VERSION, task: ()  => git().fetch()   },
            {   title: "Check git status".bold,                enabled: ctx => ctx.version < CURRENT_VERSION, task: ()  => checkWorkingCopyCleanliness().catch( err => {throw err} ) }, 
            {   title: "Upgrade 1 to 2",                       enabled: ctx => ctx.version == 1,              task: ()  => upgrade1to2() },
            {   title: "Upgrade 2 to 3",                       enabled: ctx => ctx.version == 2,              task: ()  => upgrade2to3() }
        ]).run()

        console.log("\nDone".green, "\Upgrade successfull. Please commit your changes after reviewing them.\n");

    } catch(err) {
        console.error("\n",err.message);
    } 
}
module.exports = upgradeRepo;


function getCurrentVersion() {
    try { 
        return fs.readFileSync('.version', 'utf8');
    } catch { 
        let legacyFilename = 'environments/prod/server'
        try {
            fs.readFileSync(legacyFilename, 'utf8')
            return 2
        } catch { }

        legacyFilename = '.server'
        try {
            fs.readFileSync(legacyFilename, 'utf8')
            return 1
        } catch { }

        return 9999
    }
}

function upgrade1to2() {
    setupEnvironment("prod")
}

function upgrade2to3() {
    fs.writeFile(".version", "3")
}