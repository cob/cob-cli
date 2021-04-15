exports.option = {
  name: 'Importer - Add a server event based behaviour (https://learning.cultofbits.com)', 
  value: "Backend",
  short: "Backend",
  questions: [
    require("./commonQuestions").dashboardNameQuestion
  ],
  customization: function (answers) {
    console.log("vueGrid:" + JSON.stringify(answers, null, '  '));
  }
}