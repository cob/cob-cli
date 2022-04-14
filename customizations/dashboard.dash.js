exports.option = { 
    name: 'Dash - Dynamic Dashboard based on instances from a specific definition', 
    short: "Dash",
    questions: [
    ],
    customization: function (answers) {
        const { copy } = require("../lib/task_lists/customize_copy");
        const  target = "./recordm/customUI/dash/"
        return copy("../../templates/dashboards/dash/",target)
    }
}