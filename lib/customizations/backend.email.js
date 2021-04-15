exports.option = {
  name: 'Send an email after something happens (https://learning.cultofbits.com)', 
  short: "Send Email",
  questions: [
    require("./common.questions").dashboardNameQuestion
  ],
  customization: function (answers) {
      console.log("TODO - SendEmail:" + JSON.stringify(answers, null, '  '));
  }
}