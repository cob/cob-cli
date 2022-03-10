exports.option = {
  name: 'User - Allows for $user in definitions (https://learning.cultofbits.com)', 
  short: "User",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying User keyword customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/keywords/user/frontend",fe_target)
      const be_target = "./integrationm/"
      await copy("../../templates/keywords/user/backend",be_target)
      await mergeFiles("Keyword.User")
  }
}