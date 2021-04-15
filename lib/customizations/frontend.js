exports.option = {
  name: 'Frontend - Change behaviour of standard interface (https://learning.cultofbits.com)', 
  value: "Frontend",
  short: "Frontend",
  questions: [
    require("./common.questions").dashboardNameQuestion
  ],
  customization: function (answers) {
      console.log("TODO - frontend:" + JSON.stringify(answers, null, '  '));
  }
}