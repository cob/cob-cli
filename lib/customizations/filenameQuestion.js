const dashboardNameQuestion = {
  type: 'input',
  name: 'name',
  message: 'What name for the url?',
  validate: function (value) {
    var pass = value.match(
      /^[0-9a-bA-Z]+$/i
    );
    if (pass) {
      return true;
    }

    return 'only letters and numbers name';
  }
};
exports.dashboardNameQuestion = dashboardNameQuestion;
