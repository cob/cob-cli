exports.option = { 
    name: 'Simple - basic files to start from scratch', 
    short: "Simple",
    questions: [
        require("./common.questions").dashboardNameQuestion
    ],
    customization: function (answers) {
        const { copy } = require("./common.copy");
        const target = "./recordm/customUI/"+answers.name+"/"
        return copy("../templates/cob-dashboard-vue/",target)
    }
}