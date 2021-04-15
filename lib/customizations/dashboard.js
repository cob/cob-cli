exports.option = {
  name: "Dashboards",
  description: "Create a dashboard", 
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