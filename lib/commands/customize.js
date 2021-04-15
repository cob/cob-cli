const inquirer = require('inquirer');
const colors = require('colors');

/* ************************************************************************ */
function customize() {
    console.log('Customize...');

    process({
        treeChoice: [ {
          type: 'list',
          name: 'treeChoice',
          message: 'What type of costumization ?',
          choices: [
            require("../customizations/dashboard").option
          ]
        }]
    })

    // console.log(colors.green("\nDone"), "\nTry:");
    // console.log("\tcob-cli test\n")
}

module.exports = customize;

/* ************************************************************************ */

function process(option) {
  if(option.treeChoice) {
    // Routing questions MUST have a SINGLE question, of type LIST, and the answer variable MUST be called 'treeChoice'
    inquirer.prompt(option.treeChoice).then(answers => {
      let subOption = option.treeChoice[0].choices.find(o => answers.treeChoice == o.value || answers.treeChoice == o.name)
      process(subOption)
    })
  } else if(option.customization) {
    // Final customization options can have many questions and MUST have a customization() function to process the answers
    inquirer.prompt(option.questions).then(answers => {
      option.customization(answers)
    })
  }
}

