const inquirer = require('inquirer');
const colors = require('colors');

/* ************************************************************************ */
async function customize() {
    console.log('Customize...');

    await processOption({
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

    console.log(colors.green("\nDone"), "\nTry:");
    console.log("\tcob-cli test\n")
}

module.exports = customize;

/* ************************************************************************ */

async function processOption(option) {
  if(option.treeChoice) {
    // Routing questions MUST have a SINGLE question, of type LIST, and the answer variable MUST be called 'treeChoice'
    await inquirer.prompt(option.treeChoice).then(async answers => {
      let subOption = option.treeChoice[0].choices.find(o => answers.treeChoice == o.value || answers.treeChoice == o.name)
      await processOption(subOption)
    })
  } else if(option.customization) {
    // Final customization options can have many questions and MUST have a customization() function to process the answers
    await inquirer.prompt(option.questions).then(async answers => {
      await option.customization(answers)
    })
  } else {
    console.error("\n Customization option not supported");
  }
}

