#!/usr/bin/env node

const program   = require('commander');

const init      = require("../lib/init");
const customize = require("../lib/customize");
const test      = require("../lib/test");
const deploy    = require("../lib/deploy");

/*******************************************/
program
    .description('CoB Command line to simplify server customizations')
    .usage("command")
    

program
    .command('init')
    .usage("<server>")
    .arguments('<server>')
    .description('Initializes a server customization. Use <server>.cultofbits.com (name without the FQDN)')
    .action( (server) => init(server) );

program
    .command('customize')
    .description('Interactive prompt to customize an aspect of the server')
    .action( () => customize() );


program
    .command('test')
    .description('Local test the current customization')
    .action( () => test() );


program
    .command('deploy')
    .usage("")
    .description('Deploy current customization to the server')
    .action( () => deploy() );


program.parse(process.argv);
