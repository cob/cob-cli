#!/usr/bin/env node

const program   = require('commander');

const init      = require("../lib/commands/init");
const customize = require("../lib/commands/customize");
const test      = require("../lib/commands/test");
const deploy    = require("../lib/commands/deploy");
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
    .option('-a --repoaccount <account url>', 'Specify git account to use', "https://gitlab.com/cob/")
    .option('-V --verbose', 'verbose execution of tasks')
    .description('Initializes a server customization repository. Use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .action( (servername,args) => init(servername,args) );

program
    .command('customize')
    .description('Interactive prompt to customize an aspect of the server')
    .action( () => customize() );

program
    .command('test')
    .option('-d --dashboard <name>', 'Aditionally specify a VUE dashboard to test')
    .option('-l --localOnly', 'test only localFiles (customUI)')
    .description('Test the customization')
    .action( (args) => test(args) );

program
    .command('deploy')
    .option('-f --force', 'skips comparisons')
    .option('-V --verbose', 'verbose execution of tasks')
    .description('Deploy customization to the server')
    .action( (args) => deploy(args) );


program
    .command('updateFromServer')
    .description('Updates local copy with current files on server, in case of changes made out of standard process.')
    .action( () => updateFromServer() );

program.parse(process.argv);
