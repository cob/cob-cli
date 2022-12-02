exports.option = {
  name: 'Audit - Allows for $user in definitions (https://learning.cultofbits.com/docs/cob-platform/admins/managing-information/available-customizations/audit/)', 
  short: "Audit",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying Audit keyword customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/keywords/audit/frontend",fe_target)
      const be_target = "./integrationm/"
      await copy("../../templates/keywords/audit/backend",be_target)
      await mergeFiles("Keyword.Audit")
      return require("../templates/keywords/audit/package.json").version
  }
}