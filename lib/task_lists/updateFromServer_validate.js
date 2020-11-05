require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { getServer, getServerName, getCurrentBranch, checkWorkingCopyCleanliness } = require("./helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")

function validateUpdateFromServerConditions(server) {
    let defaultserver = getServer(getServerName());
    let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";

    console.log("Checking conditions to update cob-cli files from", serverStr );
    return new Listr([
        {   title: "Update with origin: git fetch origin",                             task: () => git().fetch()   },
        {   title: "Check HEAD is not dettached",                                      task: () => getCurrentBranch().then( currentBranch => { if(!currentBranch) throw new Error("Aborded:".red + " git head is dettached")} ) }, 
        {   title: "Check git status",                                                 task: () => checkWorkingCopyCleanliness() }, 
        {   title: "Check there's no cob-cli test' running",                           task: () => checkNoTestsRunningOnServer(server) },
   ])
}
exports.validateUpdateFromServerConditions = validateUpdateFromServerConditions