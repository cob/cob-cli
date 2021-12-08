exports.definitionNameQuestion = {
  type: 'input',
  name: 'name',
  message: 'What\'s the name of the definition?',
  description: 'the name of the definition listing to customize'
};

exports.dashboardNameQuestion = {
  type: 'input',
  name: 'name',
  message: 'What name for the url?',
  description: 'a valid name consist of one Word composed of letters and numbers',
  validate: function (value) {
    var pass = value.match(
      /^[-0-9a-bA-Z]+$/i
    );
    if (pass) {
      return true;
    }

    return 'Only letters and numbers name, at least one';
  }
};

exports.dashboardNameQuestion2  = {
  type: 'input',
  name: 'name2',
  message: 'What name for the url2?',
  description: 'a valid name consist of one Word composed of letters and numbers',
  validate: function (value) {
    var pass = value.match(
      /^[-0-9a-bA-Z]+$/i
    );
    if (pass) {
      return true;
    }

    return 'Only letters and numbers name, at least one';
  }
};