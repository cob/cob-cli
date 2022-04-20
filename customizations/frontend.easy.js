exports.option = {
  name: 'Easy - Permission management helper', 
  short: "Easy",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying easy customizations ...")

      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      await copy("../../templates/frontend/easy/webapp/", "./userm/customUI/easy/")
      await copy("../../templates/frontend/easy/css/", "./userm/customUI/css/")
      await copy("../../templates/frontend/easy/js/", "./userm/customUI/js/")
      await mergeFiles("Frontend.Easy")
  }
}
