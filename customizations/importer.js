exports.option = {
  name: 'Importer - Add a server event based behaviour (https://learning.cultofbits.com)', 
  short: "Backend",
  questions: [
    require("../lib/task_lists/customize_questions").dashboardNameQuestion
  ],
  customization: function (answers) {
    console.log("TODO - importer:" + JSON.stringify(answers, null, '  '));
  }
}