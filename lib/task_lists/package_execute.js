const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const { copyFiles } = require("./common_syncFiles");
const fs = require("fs");
const tar = require('tar');
const { format } = require('date-fns');


function executeTasks(cmdEnv, args) {
    console.log("\nPackaging ...");

    return new Listr([
        {title: "Apply new enviroment specifics", task: () => cmdEnv.applyCurrentCommandEnvironmentChanges() },
        {title: "Create staging dir",             task: () => fs.existsSync('.staging') || fs.mkdirSync('.staging') },
        {title: "Copy files to staging dir",      task: () => copyFiles(cmdEnv, "localCopy", "staging")},
        {title: "Create package",                 task: async () => { const filename = await createPackage(cmdEnv, args); console.log("created " + filename) }},
        {title: "Sign package",                   task: () => console.log("lololo")},
        {title: "Delete staging dir",             task: () => fs.rmSync('.staging', {recursive: true, force: true})},
        {title: "Undo new enviroment specifics",  task: () => cmdEnv.unApplyCurrentCommandEnvironmentChanges() },
    ], {
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    });
}
exports.executeTasks = executeTasks;

const createPackage = async function(cmdEnv, args){
   const filename = `${cmdEnv.servername}-${cmdEnv.name}-${format(new Date(), 'yyyy-MM-dd_HH:mm')}.tar.gz`; 
   const files = fs.readdirSync('.staging')
   if (args.verbose > 0){
      console.log("packaging " + files)
   }

   await tar.create({
      gzip: true,
      file: filename,
      cwd: '.staging'
   }, files)

   return filename;
}
