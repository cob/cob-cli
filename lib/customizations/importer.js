exports.option = {
  name: 'Importer - Add a server event based behaviour (https://learning.cultofbits.com)', 
  value: "Backend",
  short: "Backend",
  questions: [
    require("./common.questions").dashboardNameQuestion
  ],
  customization: function (answers) {
    console.log("TODO - importer:" + JSON.stringify(answers, null, '  '));
  }
}