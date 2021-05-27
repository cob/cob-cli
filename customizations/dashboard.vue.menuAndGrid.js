exports.option = { 
    name: "Menu+Grid - menu column and simple grid structure", 
    short: "GrMenu+Gridid",
    questions: [
        require("../lib/task_lists/customize_questions").dashboardNameQuestion
    ],
    customization: function (answers) {
        console.log("TODO - vueMenuGrid:" + JSON.stringify(answers, null, '  '));
    }
}