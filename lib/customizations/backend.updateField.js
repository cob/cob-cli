exports.option = {
  name: 'Update a field (https://learning.cultofbits.com)', 
  short: "Update",
  questions: [
    require("./common.questions").dashboardNameQuestion,
    require("./common.questions").dashboardNameQuestion2,
  ],
  customization: function (answers) {
      console.log("TODO - updateField:" + JSON.stringify(answers, null, '  '));
  }
}