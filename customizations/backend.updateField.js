exports.option = {
  name: 'Update a field (https://learning.cultofbits.com)', 
  short: "Update",
  questions: [
    require("../lib/task_lists/customize_questions").dashboardNameQuestion,
    require("../lib/task_lists/customize_questions").dashboardNameQuestion2
  ],
  customization: function (answers) {
      console.log("TODO - updateField:" + JSON.stringify(answers, null, '  '));
  }
}