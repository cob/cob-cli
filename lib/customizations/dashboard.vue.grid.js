const { dashboardNameQuestion } = require("./commonQuestions");

exports.option = { 
    name: "Grid - simple grid structure", 
    value: 'Grid', 
    short: "Grid",
    questions: [
        dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("vueGrid:" + JSON.stringify(answers, null, '  '));
    }
}