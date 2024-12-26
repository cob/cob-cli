require('colors');
const Listr = require('listr');
const { checkWorkingCopyCleanliness, checkConnectivity } = require("./common_helpers");

function validateUpdateCustomizationVersionsConditions(cmdEnv) {
    console.log("Checking conditions to update cob-cli files from", cmdEnv.serverStr );
    return new Listr([
        {   title: "Check connectivity and permissions".bold,      task: () => checkConnectivity(cmdEnv.server) },
        {   title: "Check git status".bold,                        task: () => checkWorkingCopyCleanliness() }, 
   ])
}
exports.validateUpdateCustomizationVersionsConditions = validateUpdateCustomizationVersionsConditions