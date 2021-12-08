exports.option = {
  name: 'FormatList - Add classes to change the style of specified columns in search results', 
  short: "FormatList",
  followUp: [ {
    type: 'list',
    name: 'choosenFollowUp',
    message: 'Select one?',
    choices: [
        require("./frontend.formatList.currency").option//,
        // require("./frontend.formatList.percentage").option
    ]}
  ]
}