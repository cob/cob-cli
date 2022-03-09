exports.option = {
  name: 'UserOfLastUpdate - Allows for $userOfLastUpdate in definitions (https://learning.cultofbits.com)', 
  short: "UserOfLastUpdate",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying UserOfLastUpdate backend customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/backend/userOfLastUpdate/frontend_counterpart",fe_target)
      const be_target = "./integrationm/scripts/"
      await copy("../../templates/backend/userOfLastUpdate/scripts",be_target)
      await mergeFiles("Backend.UserOfLastUpdate")
  }
}