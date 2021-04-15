const inquirer = require('inquirer');
const colors = require('colors');

/* ************************************************************************ */
async function customize() {
    console.log('Customize...');

    let result = await processOption({
        treeChoice: [ {
          type: 'list',
          name: 'treeChoice',
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

async function processOption(option) {
  if(option.treeChoice) {
    // Routing questions MUST have a SINGLE question, of type LIST, and the answer variable MUST be called 'treeChoice'
    return await inquirer.prompt(option.treeChoice).then(async answers => {
      let subOption = option
                        .treeChoice[0]
                        .choices.find(
                          o => answers.treeChoice == o.value // suport questions with value
                          || answers.treeChoice == o.name    // and questions with name only
                        ) 
      return await processOption(subOption)
    })
  } else if(option.customization) {
    // Final customization options can have many questions and MUST have a customization() function to process the answers
    return await inquirer.prompt(option.questions).then(async answers => {
      return await option.customization(answers)
    })
  } else {
    return "Customization option not supported";
  }
}

