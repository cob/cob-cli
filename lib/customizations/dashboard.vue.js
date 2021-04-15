exports.option = { 
  name: 'Vue - Vue + Vuetify + cob libs', 
  short: "Vue",
  followUp: [ {
    type: 'list',
    name: 'choosenFollowUp',
    message: 'Which template do you want to start with?',
    choices: [
      require("./dashboard.vue.empty").option,
      require("./dashboard.vue.grid").option,
      require("./dashboard.vue.menuAndGrid").option,
    ]}
  ]
}
