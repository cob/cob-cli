const inquirer = require('inquirer');
const colors = require('colors');

/* ************************************************************************ */
async function customize() {
    console.log('Customize...');

    let result = await processOption({
        followUp: [ {
          type: 'list',
          name: 'choosenFollowUp',
          message: 'What type of costumization do you want ?',
          choices: [
            require("../customizations/dashboard").option,
            require("../customizations/frontend").option,
            require("../customizations/backend").option,
          ]
        }]
    })

    if(result) {
      console.error(colors.red("\nError"), result, "\n")
    } else {
      console.log(colors.green("\nDone"), "\nTry:");
      console.log("\tcob-cli test\n")
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
    return inquirer.prompt(option.questions).then( answers => option.customization(answers) )
  }

  return "Customization option not supported";
}