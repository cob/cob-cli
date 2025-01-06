require('colors');
const Listr = require('listr');
const { checkWorkingCopyCleanliness } = require("./common_helpers");

function validateUpdateCustomizationVersionsConditions(cmdEnv,args) {
    console.log("Checking conditions to update cob-cli files from", cmdEnv.serverStr );
    const validationList = []
    if (!args.ignoreMainBranch){
            validationList.push(
                {   title: "Check branch is master".bold,                  
                    task: () => {
                        if (cmdEnv.currentBranch != "master" && cmdEnv.currentBranch != "main"){
                            throw new Error("The current branch is neither Main nor Master!")
                        }
                    } 
                }
            )
    }
    if (!args.ignoreGitStatus){
        validationList.push(
            {   title: "Check git status".bold,
                task: () => checkWorkingCopyCleanliness() 
            }) 
    }
    return new Listr(validationList)
}
exports.validateUpdateCustomizationVersionsConditions = validateUpdateCustomizationVersionsConditions