exports.option = {
  name: 'Keywords - Add a keyword for use in definitions (https://learning.cultofbits.com)', 
  short: "Keywords",
  followUp: [ {
    type: 'list',
    name: 'choosenFollowUp',
    message: 'Select one?',
    choices: [
        require("./keywords.calc").option,
        require("./keywords.audit").option
    ]}
  ]
}