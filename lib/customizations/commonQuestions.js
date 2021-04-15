const dashboardNameQuestion = {
  type: 'input',
  name: 'name',
  message: 'What name for the url?',
  description: 'a valid name consist of one Word composed of letters and numbers',
  validate: function (value) {
    var pass = value.match(
      /^[0-9a-bA-Z]+$/i
    );
    if (pass) {
      return true;
    }

    return 'Only letters and numbers name, at least one';
  }
};
exports.dashboardNameQuestion = dashboardNameQuestion;
