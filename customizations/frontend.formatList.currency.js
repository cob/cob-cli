exports.option = { 
  name: 'FormatCurrency - Make $style[currency] available on definitions', 
  short: "Simple",
  questions: [
  ],
  customization: async function (answers) {
      console.log("\nApplying FormatCurrency frontend customizations ...")
      
      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      
      const target = "./recordm/customUI/"
      await copy("../../templates/frontend/formatList/currency/",target)
      await mergeFiles("frontend.formatList.currency.js")
      return require("../templates/frontend/formatList/currency/package.json").version
  }
}