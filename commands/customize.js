const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');


let values = {}

// coffee types
values.options = [
    {name: 'Espresso', price: '$5.99'},
    {name: 'Latte', price: '$4.50'},
    {name: 'Cappuchino', price: '$3.99'},
    {name: 'Americano', price: '$2.50'},
    {name: 'Macchiato', price: '$3.50'},
];
values.typesPlain = values.options.map(function(o) {
    return o.name + ' (' + o.price + ')'; // convert to one line
});

// sugar levels
values.sugar = [
    {name: 'Low', spoons: '1'},
    {name: 'Medium', spoons: '2'},
    {name: 'High', spoons: '3'},
    {name: 'Very High', spoons: '4'},
];
values.sugarPlain = values.sugar.map(function(o) {
    return o.name + ' (' + o.spoons + ' spoons)'; // convert to one line
});

// served in
values.servedIn = [
    "Mug",
    "Cup",
    "Takeway package"
];

const questions = [
    { type: 'list', name: 'coffeType', message: 'Choose coffee type', choices: values.typesPlain },
    { type: 'list', name: 'sugarLevel', message: 'Choose your sugar level', choices: values.sugarPlain },
    { type: 'confirm', name: 'decaf', message: 'Do you prefer your coffee to be decaf?', default: false },
    { type: 'confirm', name: 'cold', message: 'Do you prefer your coffee to be cold?', default: false },
    { type: 'list', name: 'servedIn', message: 'How do you prefer your coffee to be served in', choices: values.servedIn },
    { type: 'confirm', name: 'stirrer', message: 'Do you prefer your coffee with a stirrer?', default: true },
];

module.exports = function () {
    console.log('Deploy');
    inquirer
        .prompt(questions)
        .then(function (answers) {
            console.log('YOUR ORDER');
            console.log('------------------');

            console.log(pad(colors.grey('Coffee type: '), 30), answers.coffeType);
            console.log(pad(colors.grey('Sugar level: '), 30), answers.sugarLevel);
            console.log(pad(colors.grey('Decaf: '), 30), answers.decaf);
            console.log(pad(colors.grey('Cold: '), 30), answers.cold);
            console.log(pad(colors.grey('Served in: '), 30), answers.servedIn);
            console.log(pad(colors.grey('With stirrer: '), 30), answers.stirrer);
            
        });
};
