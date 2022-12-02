exports.option = {
  name: 'Kibana - Allows for $kibana[dashboardId [,heigth])', 
  short: "Kibana",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying Kibana keyword customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/keywords/kibana/frontend",fe_target)
      await mergeFiles("Keyword.Kibana")
      return require("../templates/keywords/kibana/package.json").version
  }
}