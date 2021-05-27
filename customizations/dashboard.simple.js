exports.option = { 
    name: 'Simple - Just HTML code and cob libs', 
    short: "Simple",
    questions: [
        require("../lib/task_lists/customize_questions").dashboardNameQuestion
    ],
    customization: function (answers) {
        const { copy } = require("../lib/task_lists/customize_copy");
        const  target = "./recordm/customUI/"+answers.name+".html"
        return copy("../../templates/cob-dashboard-html/demoDashboard.html",target)
    }
}