const { dashboardNameQuestion } = require("./commonQuestions");

exports.option = { 
    name: "Menu+Grid - menu column and simple grid structure", 
    value: 'Menu+Grid', 
    short: "GrMenu+Gridid",
    questions: [
        dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("vueMenuGrid:" + JSON.stringify(answers, null, '  '));
    }
}