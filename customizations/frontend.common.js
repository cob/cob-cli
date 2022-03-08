exports.option = {
  name: 'Common - Typical frontend customizations (https://learning.cultofbits.com)', 
  short: "Common",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying common frontend customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const target = "./recordm/customUI/"
      await copy("../../templates/frontend/common/",target)
      await mergeFiles("Frontend.Common")
  }
}