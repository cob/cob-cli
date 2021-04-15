exports.option = {
  name: 'Dashboards - Create or change dashboards (https://learning.cultofbits.com)', 
  short: "Dashboards",
  treeChoice: [ {
    type: 'list',
    name: 'treeChoice',
    message: 'Which type of dashboard?',
    choices: [
        require("./dashboard.simple").option,
        require("./dashboard.vue").option
    ]}
  ]
}