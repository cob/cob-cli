exports.option = {
  name: 'StyleResult - Allows for $styleResults in definitions (https://learning.cultofbits.com/docs/cob-platform/admins/managing-information/available-customizations/styleResults/)', 
  short: "StyleResults",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying StyleResults keyword customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      const fe_target = "./recordm/customUI/"
      await copy("../../templates/keywords/styleResults/frontend",fe_target)
      const be_target = "./integrationm/"
      await copy("../../templates/keywords/styleResults/backend",be_target)
      await mergeFiles("Keyword.StyleResults")
  }
}