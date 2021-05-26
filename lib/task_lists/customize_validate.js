
require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { checkWorkingCopyCleanliness } = require("./common_helpers");
const { getCurrentBranch } = require("./common_releaseManager");

function validateCustomizeConditions() {
    console.log("Checking conditions to customize cob-cli files");
    return new Listr([
        {   title: "Check HEAD is not dettached".bold,             task: () => getCurrentBranch().then( currentBranch => { if(!currentBranch) throw new Error("Aborded:".red + " git head is dettached")} ) }, 
        {   title: "Update with origin: git fetch origin",         task: () => git().fetch()   },
        {   title: "Check git status".bold,                        task: () => checkWorkingCopyCleanliness() }, 
   ])
}
exports.validateCustomizeConditions = validateCustomizeConditions