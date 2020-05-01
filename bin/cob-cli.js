#!/usr/bin/env node

const program   = require('commander');

const init      = require("../lib/commands/init");
const customize = require("../lib/commands/customize");
const test      = require("../lib/commands/test");
const deploy    = require("../lib/commands/deploy");

/*******************************************/
program
    .description('CoB Command line to simplify server customizations')
    .usage("command")
    
program
    .command('init')
    .usage("<server>")
    .arguments('<server>')
    .option('-l --legacy <folder>','import git history from legacy ClientConfs. <folder> should be path to server files inside ClienConfs.')
    .option('-a --repoaccount <account url>', 'Specify git account to use', "https://gitlab.com/cob/")
    .description('Initializes a server customization repository. Use <server>.cultofbits.com (i.e. name without the FQDN)')
    .action( (server,args) => init(server,args) );

program
    .command('customize')
    .description('Interactive prompt to customize an aspect of the server')
    .action( () => customize() );

program
    .command('test')
    .description('Locally test the customization')
    .action( () => test() );

program
    .command('deploy')
    .description('Deploy customization to the server')
    .action( () => deploy() );

program.parse(process.argv);
