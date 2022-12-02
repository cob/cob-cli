exports.option = {
  name: 'Log - Allows for $log in definitions (https://learning.cultofbits.com/docs/cob-platform/admins/managing-information/available-customizations/log/)', 
  short: "Log",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying Log keyword customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/keywords/log/frontend",fe_target)
      const be_target = "./integrationm/"
      await copy("../../templates/keywords/log/backend",be_target)
      await mergeFiles("Keyword.Log")
      return require("../templates/keywords/log/package.json").version
  }
}