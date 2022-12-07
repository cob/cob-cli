const path = require('path');

/* Autocomplete Component*/
var omelette = require('omelette');
const commandStructure = {
    'init' : [], 
    'customize' : [], 
    'test' : [], 
    'deploy' : [], 
    'updateFromServer' : [],
    'upgradeRepo' : []
}
const completion = omelette('cob-cli').tree(commandStructure)
completion.init()

// add to system profiles
if (~process.argv.indexOf('--setup')) {
    completion.setupShellInitFile()
}
// remove from system profiles
if (~process.argv.indexOf('--cleanup')) {
    completion.cleanupShellInitFile()
}