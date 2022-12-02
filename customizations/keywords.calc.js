exports.option = {
  name: 'Calc - Allows for $calc in definitions (https://learning.cultofbits.com)', 
  short: "Calc",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying Calc keyword customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/keywords/calc/frontend",fe_target)
      const be_target = "./integrationm/"
      await copy("../../templates/keywords/calc/backend/",be_target)
      await mergeFiles("Keyword.Calc")
      return require("../templates/keywords/calc/package.json").version
  }
}