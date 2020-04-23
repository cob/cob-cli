const colors = require('colors');
const { options } = require('./options');

module.exports = function(server) {
    console.log('Test');
    console.log('------------------');

    // list on separate lines
    options.forEach((option) => {
        console.log('%s %s', colors.bold(option.name), colors.grey('/ '+ option.price));
    });
}
