require('colors');
const Listr = require('listr');
const { checkWorkingCopyCleanliness, checkConnectivity } = require("./common_helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")

function validateUpdateFromServerConditions(cmdEnv) {
    console.log("Checking conditions to update cob-cli files from", cmdEnv.serverStr );
    return new Listr([
        {   title: "Check connectivity and permissions".bold,      task: () => checkConnectivity(cmdEnv.server) },
        {   title: "Check there's no cob-cli test' running".bold,  task: () => checkNoTestsRunningOnServer(cmdEnv.server) },
        {   title: "Check git status".bold,                        task: () => checkWorkingCopyCleanliness() }, 
   ])
}
exports.validateUpdateFromServerConditions = validateUpdateFromServerConditions