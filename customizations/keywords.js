exports.option = {
  name: 'Keywords - Add a keyword for use in definitions (https://learning.cultofbits.com/docs/cob-platform/admins/managing-information/available-customizations/)', 
  short: "Keywords",
  followUp: [ {
    type: 'list',
    name: 'choosenFollowUp',
    message: 'Select one?',
    choices: [
        require("./keywords.calc").option,
        require("./keywords.audit").option,
        require("./keywords.log").option
    ]}
  ]
}