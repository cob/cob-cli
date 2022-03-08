exports.option = {
  name: 'Common - Typical backend customizations (https://learning.cultofbits.com)', 
  short: "Common",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying common backend customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/backend/common/frontend_counterpart",fe_target)
      const be_target = "./integrationm/scripts/"
      await copy("../../templates/backend/common/scripts",be_target)
      await mergeFiles("Backend.Common")
  }
}