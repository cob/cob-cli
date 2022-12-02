exports.option = { 
    name: 'Dash - Dynamic Dashboard based on instances from a specific definition', 
    short: "Dash",
    questions: [
    ],
    customization: async function (answers) {
        console.log("\nApplying Dash keyword customizations ...")

        const { copy } = require("../lib/task_lists/customize_copy");
        const  target = "./recordm/customUI/dash/"
        await copy("../../templates/dashboards/dash/",target)
        return require("../templates/dashboards/dash/package.json").version
    }
}