exports.option = { 
    name: "Grid - simple grid structure", 
    value: 'Grid', 
    short: "Grid",
    questions: [
        require("./commonQuestions").dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("TODO - vueGrid:" + JSON.stringify(answers, null, '  '));
    }
}