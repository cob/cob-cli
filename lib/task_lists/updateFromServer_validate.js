require('colors');
const Listr = require('listr');
const execa = require('execa');
const git = require('simple-git/promise');
const { getServer, getServerName, getCurrentBranch, checkWorkingCopyCleanliness } = require("./helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")

function validateUpdateFromServerConditions(server) {
    let defaultserver = getServer(getServerName());
    let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";

    console.log("Checking conditions to update cob-cli files from", serverStr );
    return new Listr([
        {   title: "Check connectivity and peremissions".bold,                         task: ()     => execa('ssh', [server, "touch /etc/recordm/recordm.rc"]) },
        {   title: "Check there's no cob-cli test' running".bold,                      task: () => checkNoTestsRunningOnServer(server) },
        {   title: "Check HEAD is not dettached".bold,                                 task: () => getCurrentBranch().then( currentBranch => { if(!currentBranch) throw new Error("Aborded:".red + " git head is dettached")} ) }, 
        {   title: "Update with origin: git fetch origin",                             task: () => git().fetch()   },
        {   title: "Check git status".bold,                                            task: () => checkWorkingCopyCleanliness() }, 
   ])
}
exports.validateUpdateFromServerConditions = validateUpdateFromServerConditions