exports.option = {
  name: 'Update a field (https://learning.cultofbits.com)', 
  value: "Update",
  short: "Update",
  questions: [
    require("./commonQuestions").dashboardNameQuestion
  ],
  customization: function (answers) {
      console.log("TODO - updateField:" + JSON.stringify(answers, null, '  '));
  }
}