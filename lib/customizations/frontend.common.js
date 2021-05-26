exports.option = {
  name: 'Common - Typical frontend customizations (https://learning.cultofbits.com)', 
  short: "Common",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying common frontend customizations ...")

      const { copy } = require("./common.copy");
      const { mergeFiles } = require("./common.mergeFiles");
      const target = "./recordm/customUI/"
      await copy("../templates/frontend/common/",target)
      await mergeFiles()
  }
}