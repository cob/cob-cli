const { dashboardNameQuestion } = require("./commonQuestions");

exports.option = { 
    name: 'Empty - basic files to start from scratch', 
    value: "Empty",
    short: "Empty",
    questions: [
        dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("vueEmpty:" + JSON.stringify(answers, null, '  '));
    }
}