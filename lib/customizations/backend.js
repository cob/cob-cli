exports.option = {
  name: 'Backend - Add a server event based behaviour (https://learning.cultofbits.com)', 
  value: "Backend",
  short: "Backend",
  treeChoice: [ {
    type: 'list',
    name: 'treeChoice',
    message: 'Select one?',
    choices: [
        require("./backend.email").option,
        require("./backend.updateField").option
    ]}
  ]
}