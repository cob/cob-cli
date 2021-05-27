require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { checkWorkingCopyCleanliness, checkConnectivity } = require("./common_helpers");
const { getCurrentBranch } = require("./common_releaseManager");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")

function validateUpdateFromServerConditions(cmdEnv) {
    console.log("Checking conditions to update cob-cli files from", cmdEnv.serverStr );
    return new Listr([
        {   title: "Check connectivity and permissions".bold,      task: () => checkConnectivity(cmdEnv.server) },
        {   title: "Check there's no cob-cli test' running".bold,  task: () => checkNoTestsRunningOnServer(cmdEnv.server) },
        {   title: "Check HEAD is not dettached".bold,             task: () => getCurrentBranch().then( currentBranch => { if(!currentBranch) throw new Error("Aborded:".red + " git head is dettached")} ) }, 
        {   title: "Update with origin: git fetch origin",         task: () => git().fetch()   },
        {   title: "Check git status".bold,                        task: () => checkWorkingCopyCleanliness() }, 
   ])
}
exports.validateUpdateFromServerConditions = validateUpdateFromServerConditions