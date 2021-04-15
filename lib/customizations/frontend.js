exports.option = {
  name: 'Frontend - Change behaviour of standard interface (https://learning.cultofbits.com)', 
  value: "Frontend",
  short: "Frontend",
  questions: [
    require("./commonQuestions").dashboardNameQuestion
  ],
  customization: function (answers) {
      console.log("frontend:" + JSON.stringify(answers, null, '  '));
  }
}