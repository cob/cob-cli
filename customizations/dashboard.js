exports.option = {
  name: 'Dashboards - Create or change dashboards (https://learning.cultofbits.com)', 
  short: "Dashboards",
  followUp: [ {
    type: 'list',
    name: 'choosenFollowUp',
    message: 'Which type of dashboard?',
    choices: [
        require("./dashboard.dash").option,
        require("./dashboard.simple").option,
        require("./dashboard.vue").option
    ]}
  ]
}