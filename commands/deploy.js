const colors = require('colors');

const options = [
    {name: 'Espresso', price: '$5.99'},
    {name: 'Latte', price: '$4.50'},
    {name: 'Cappuchino', price: '$3.99'},
    {name: 'Americano', price: '$2.50'},
    {name: 'Macchiato', price: '$3.50'},
];

module.exports = function(server) {
    console.log('Deploy');
    console.log('------------------');

    // list on separate lines
    options.forEach((option) => {
        console.log('%s %s', colors.bold(option.name), colors.grey('/ '+ option.price));
    });
}