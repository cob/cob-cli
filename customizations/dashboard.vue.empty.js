exports.option = { 
    name: 'Simple - basic files to start from scratch', 
    short: "Simple",
    questions: [
        require("../lib/task_lists/customize_questions").dashboardNameQuestion
    ],
    customization: function (answers) {
        const { copy } = require("../lib/task_lists/customize_copy");
        const target = "./recordm/customUI/"+answers.name+"/"
        return copy("../../templates/cob-dashboard-vue/",target)
    }
}