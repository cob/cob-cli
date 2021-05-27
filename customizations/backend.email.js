exports.option = {
  name: 'Send an email after something happens (https://learning.cultofbits.com)', 
  short: "Send Email",
  questions: [
    require("../lib/task_lists/customize_questions").dashboardNameQuestion
  ],
  customization: function (answers) {
      console.log("TODO - SendEmail:" + JSON.stringify(answers, null, '  '));
  }
}