exports.option = {
  name: 'Backend - Add a server event based behaviour (https://learning.cultofbits.com)', 
  short: "Backend",
  followUp: [ {
    type: 'list',
    name: 'choosenFollowUp',
    message: 'Select one?',
    choices: [
        require("./backend.calc").option,
        require("./backend.email").option,
        require("./backend.updateField").option
    ]}
  ]
}