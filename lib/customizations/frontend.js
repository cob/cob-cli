exports.option = {
  name: 'Frontend - Change behaviour of standard interface (https://learning.cultofbits.com)', 
  short: "Frontend",
  followUp: [ {
    type: 'list',
    name: 'choosenFollowUp',
    message: 'Select one?',
    choices: [
        require("./frontend.common").option
    ]}
  ]
}