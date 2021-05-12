#!/usr/bin/env node

const path = require('path');
const directoryPath = path.join(__dirname,"../lib/customizations/");

const files = () => require('fs').readdirSync(directoryPath).filter(f => !f.startsWith("common")).map(f => f.substr(0,f.lastIndexOf(".")))

/* Autocomplete Component*/
var omelette = require('omelette');
const commandStructure = {
    'init' : [], 
    'customize' : files, 
    'test' : [], 
    'deploy' : [], 
    'updateFromServer' : []
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

/*******************************************/

const program = require('commander');

const init             = require("../lib/commands/init");
const customize        = require("../lib/commands/customize");
const test             = require("../lib/commands/test");
const deploy           = require("../lib/commands/deploy");
const updateFromServer = require("../lib/commands/updateFromServer");

/*******************************************/
program
    .description('CoB Command line to simplify server customizations')
    .usage("command")
    .version( require('../package.json').version,'-v, --version', 'output the current version');
    
program
    .command('init')
    .usage("<servername>")
    .arguments('<servername>')
    .option('-l --legacy <folder>','import git history from legacy ClientConfs. <folder> should be path to server files inside ClienConfs.')
    .option('-a --repoaccount <account url>', 'Specify git account to use', "git@gitlab.com:cob/")
    .option('-V --verbose', 'verbose execution of tasks')
    .description('Initializes a server customization repository. Use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .action( (servername,args) => init(servername,args) );
    
program
    .command('customize')
    .arguments('[name]', "Name of the customization", "interactive menu")
    .description('Interactive prompt to customize an aspect of the server')
    .action( (name) => customize(name) );

program
    .command('test')
    .option('-V --verbose', 'verbose execution of tasks')
    .option('-e --environment <name>', 'environment to use')
    .option('-d --dashboard <name>', 'Aditionally specify a VUE dashboard to test')
    .option('-l --localOnly', 'test only localFiles (customUI)')
    .option('-s --servername <servername>', 'use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .description('Test the customization')
    .action( (args) => test(args) );

program
    .command('deploy')
    .option('-f --force', 'skips comparisons')
    .option('-e --environment <name>', 'environment to use')
    .option('-V --verbose', 'verbose execution of tasks')
    .option('-s --servername <servername>', 'use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .description('Deploy customization to the server')
    .action( (args) => deploy(args) );


program
    .command('updateFromServer')
    .description('Updates local copy with current files on server, in case of changes made out of standard process.')
    .option('-s --servername <servername>', 'use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .action( (args) => updateFromServer(args) );

program.parse(process.argv);