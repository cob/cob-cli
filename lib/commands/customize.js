const inquirer = require('inquirer');
const colors = require('colors');
const fs = require("fs");
const path = require('path');
const { checkWorkingCopyCleanliness } = require("../task_lists/common_helpers");
const { checkVersion } = require("./upgradeRepo");

/* ************************************************************************ */
async function customize(args) {
  try {
    checkVersion()
    console.log('Customize...');
    await checkWorkingCopyCleanliness()
  
    let defaultInteractiveOption = {
      followUp: [ {
        type: 'list',
        name: 'choosenFollowUp',
        message: 'What type of costumization do you want ?',
        choices: [
          require("../../customizations/dashboard").option,
          require("../../customizations/frontend").option,
          require("../../customizations/backend").option,
          require("../../customizations/keywords").option,
          require("../../customizations/importer").option,
        ]  
      }]  
    }      

    let initialOption
    if(args) {
      try {
        initialOption = require("../../customizations/"+args.toLowerCase()).option
      }   
      catch{
        console.log("\nWarn".yellow, "unexisting customization file, defaulting to interactive menu...\n")
      }  
    }
    initialOption = initialOption || defaultInteractiveOption

    console.log('\n');
    let result = await processOption(initialOption)
    if(result) throw new Error("Aborded:".red + result )

    console.log(colors.green("\nDone"), "\nCheck changes to your git working tree and try:");
    console.log("\tcob-cli test\n")

  } catch(err) {
    console.error("\n",err.message);
  }
}
module.exports = customize;

/* ************************************************************************ */

function processOption(option) {
  if(option.followUp) {
    // Routing questions have a 'followUp' array and MUST have a SINGLE question, be of type LIST, and the answer variable MUST be 'choosenFollowUp'
    return inquirer.prompt(option.followUp).then( answer => {
      let choosenSubOption = option.followUp[0].choices.find(option => option.name == answer.choosenFollowUp) 
      return processOption(choosenSubOption)
    })
  } else if(option.customization) {
    // Final customization options HAVE a 'customization' function, that process the answers, and HAVE one or more questions
    return inquirer.prompt(option.questions).then( answers => {
      option.customization(answers) 
      updateCustomizationsVersions(option.short, require('../../package.json').version) 
    })
  }

  return "Customization option not supported";
}

/* ************************************************************************ */

function updateCustomizationsVersions(customizationKey, version) {
  const customizationsVersionsFile = "customizations.json";
  let customizationsVersions
  try { 
      customizationsVersions = require(path.resolve(customizationsVersionsFile))
  }
  catch (err) {
      customizationsVersions = {}
  }
  customizationsVersions[customizationKey] = version;

  fs.writeFile(customizationsVersionsFile, JSON.stringify(customizationsVersions, null, 2), err => {
      if (err) console.log("Error writing " + customizationsVersionsFile + ":", err.message);
  });
}