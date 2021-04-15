exports.option = { 
    name: "Menu+Grid - menu column and simple grid structure", 
    value: 'Menu+Grid', 
    short: "GrMenu+Gridid",
    questions: [
        require("./commonQuestions").dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("TODO - vueMenuGrid:" + JSON.stringify(answers, null, '  '));
    }
}