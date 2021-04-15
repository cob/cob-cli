const { dashboardNameQuestion } = require("./commonQuestions");

exports.option = { 
    name: 'Simple - Just HTML code and cob libs', 
    short: "Simple",
    questions: [
        dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("SIMPLE:" + JSON.stringify(answers, null, '  '));
    }
}
