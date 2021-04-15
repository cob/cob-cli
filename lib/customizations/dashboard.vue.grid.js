exports.option = { 
    name: "Grid - simple grid structure", 
    value: 'Grid', 
    short: "Grid",
    questions: [
        require("./common.questions").dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("TODO - vueGrid:" + JSON.stringify(answers, null, '  '));
    }
}