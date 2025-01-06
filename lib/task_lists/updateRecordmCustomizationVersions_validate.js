require('colors');
const Listr = require('listr');
const { checkWorkingCopyCleanliness } = require("./common_helpers");

function validateUpdateCustomizationVersionsConditions(cmdEnv,args) {
    console.log("Checking conditions to update cob-cli files from", cmdEnv.serverStr );
    return new Listr([
        {   title: "Check branch is master".bold,                  
            task: () => {
                if (args.ignoreMainBranch && cmdEnv.currentBranch != "master" && cmdEnv.currentBranch != "main"){
                    throw new Error("The current branch is neither Main nor Master!")
                }
            } 
        },
        
        {   title: "Check git status".bold,
            task: () => checkWorkingCopyCleanliness() 
        }, 
   ])
}
exports.validateUpdateCustomizationVersionsConditions = validateUpdateCustomizationVersionsConditions