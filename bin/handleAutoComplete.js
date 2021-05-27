const path = require('path');
const directoryPath = path.join(__dirname,"../customizations/");

const files = () => require('fs').readdirSync(directoryPath).map(f => f.substr(0,f.lastIndexOf(".")))

/* Autocomplete Component*/
var omelette = require('omelette');
const commandStructure = {
    'init' : [], 
    'customize' : files, 
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