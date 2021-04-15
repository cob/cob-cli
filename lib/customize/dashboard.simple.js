const { dashboardNameQuestion } = require("./filenameQuestion");

exports.option = { 
    name: 'Simple - Just HTML code and cob libs', 
    value: "Simple",
    short: "Simple",
    questions: [
        dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("SIMPLE:" + JSON.stringify(answers, null, '  '));
    }
}
