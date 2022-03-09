exports.option = {
  name: 'Calc - Allows for $calc in definitions (https://learning.cultofbits.com)', 
  short: "Calc",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying Calc backend customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/backend/calc/frontend_counterpart",fe_target)
      const be_target = "./integrationm/scripts/"
      await copy("../../templates/backend/calc/scripts",be_target)
      await mergeFiles("Backend.Calc")
  }
}