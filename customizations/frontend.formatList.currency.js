exports.option = { 
  name: 'FormatCurrency - Make $style[currency] available on definitions', 
  short: "Simple",
  questions: [
      require("../lib/task_lists/customize_questions").definitionNameQuestion
  ],
  customization: async function (answers) {
      console.log("\nApplying FormatCurrency frontend customizations ...")
      const { copy } = require("../lib/task_lists/customize_copy");
      const { mergeFiles } = require("../lib/task_lists/customize_mergeFiles");
      
      const target = "./recordm/customUI/"
      let substitutions = {"__DEFINITION__": answers.name}
      await copy("../../templates/frontend/formatList/currency/",target, substitutions)
      await mergeFiles("frontend.formatList.currency.js: " + answers.name )
  }
}