exports.option = {
  name: 'Send an email after something happens (https://learning.cultofbits.com)', 
  value: "Send Email",
  short: "Send Email",
  questions: [
    require("./commonQuestions").dashboardNameQuestion
  ],
  customization: function (answers) {
      console.log("To Be Done - SendEmail:" + JSON.stringify(answers, null, '  '));
  }
}