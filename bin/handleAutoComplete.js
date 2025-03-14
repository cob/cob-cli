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
    if (process.platform === 'win32') {
        // we exit cleanly so that postinstall completes successfuly
        process.exit(0)
    }
    console.log("Setting up...")
    completion.setupShellInitFile()
}
// remove from system profiles
if (~process.argv.indexOf('--cleanup')) {
    if (process.platform === 'win32') {
        // we exit cleanly so that uninstall completes successfuly
        process.exit(0)
    }
    console.log("Cleaning...")
    completion.cleanupShellInitFile()
}
