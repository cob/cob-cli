#!/usr/bin/env node
require("./handleAutoComplete");

/*******************************************/

const program = require('commander');

const getRepos         = require("../lib/commands/getRepos");
const init             = require("../lib/commands/init");
const customize        = require("../lib/commands/customize");
const test             = require("../lib/commands/test");
const deploy           = require("../lib/commands/deploy");
const updateFromServer = require("../lib/commands/updateFromServer");
const getDefs          = require("../lib/commands/getDefs");
const { upgradeRepo }  = require("../lib/commands/upgradeRepo");

/*******************************************/
program
    .description('CoB Command line to simplify server customizations')
    .usage("command")
    .version(require('../package.json').version, '-v, --version', 'output the current version')
    .option('--setup','add autocomplete to system profiles')
    .option('--cleanup', 'remove autocomplete from system profiles')

program
    .command('getRepos')
    .description('clone (or update) all cob accessible repositories on gitlab,')
    .arguments('<token>', 'private token for gitlab (whit api read permission)')
    .action( getRepos );

program
    .command('init')
    .usage("<servername>")
    .arguments('<servername>')
    .option('-l --legacy <folder>','import git history from legacy ClientConfs. <folder> should be path to server files inside ClienConfs.')
    .option('-a --repoaccount <account url>', 'Specify git account to use', "git@gitlab.com:cob/")
    .option('-V --verbose', 'verbose execution of tasks')
    .description('Initializes a server customization repository. Use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .action( init );

program
    .command('customize')
    .arguments('[name]', "Name to filter the list of customizations", "interactive menu")
    .option('-f --force', 'skips comparisons')
    .option('-c --cache', 'cache all customizations')
    .option('-l --local', 'use local files')
    .option('-u --update', 'update all previsously added customizations')
    .description('Interactive prompt to customize an aspect of the server')
    .action( customize );

program
    .command('test')
    .option('-V --verbose', 'verbose execution of tasks')
    .option('-e --environment <name>', 'environment to use')
    .option('-d --dashboard <name>', 'Aditionally specify a VUE dashboard to test')
    .option('-l --localOnly', 'test only localFiles (customUI)')
    .option('-s --servername <servername>', 'use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .description('Test the customization')
    .action( test );

program
    .command('deploy')
    .option('-f --force', 'skips comparisons')
    .option('-e --environment <name>', 'environment to use')
    .option('-V --verbose', 'verbose execution of tasks')
    .option('-s --servername <servername>', 'use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .description('Deploy customization to the server')
    .action( deploy );

program
    .command('updateFromServer')
    .description('Updates local copy with current files on server, in case of changes made out of standard process.')
    .option('-e --environment <name>', 'environment to use')
    .option('-s --servername <servername>', 'use <servername>.cultofbits.com (i.e. name without the FQDN)')
    .action( updateFromServer );

program
    .command('upgradeRepo')
    .description('Upgrade current repository to the last cob-cli version structure')
    .action( upgradeRepo );
    
program
    .command('getDefs')
    .option('-e --environment <name>', 'environment to use')
    .description('Updates local copy with definitions on server')
    .action( getDefs );
    
program.parse(process.argv);