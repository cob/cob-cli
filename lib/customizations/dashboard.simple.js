exports.option = { 
    name: 'Simple - Just HTML code and cob libs', 
    short: "Simple",
    questions: [
        require("./common.questions").dashboardNameQuestion
    ],
    customization: function (answers) {
        const { copy } = require("./common.copy");
        const  target = "./recordm/customUI/"+answers.name+".html"
        return copy("../templates/cob-dashboard-html/demoDashboard.html",target)
    }
}