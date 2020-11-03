require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git/promise');
const { testEquality } = require("./helpers");
const { checkNoTestsRunningLocally } = require("../task_lists/test_otherFilesContiousReload");


function validateTestingConditions(server, args) {
    console.log("Checking testing conditions of", server.bold.blue );
    return new Listr([
        {   title: "Check there's no other 'cob-cli test' running locally",            task: ()     => checkNoTestsRunningLocally() },
        {   title: "git stash --include-untracked",                                    task: (ctx)  => git().stash(["--include-untracked"]).then( value => value.indexOf("Saved") == 0 && (ctx.stash = true)) }, 
        {   title: "git checkout latest tag",                                          task: ()     => git().checkoutLatestTag() }, 
        {   title: "Check local copy  == server copy",                                 task: (ctx)  => testEquality(server, "localCopy", "serverCopy").catch( err => { ctx.err = err.message; ctx.gotoEnd = true} ) },
        {   title: "Check server copy == server live",      skip: ctx => ctx.gotoEnd,  task: (ctx)  => testEquality(server, "serverCopy", "serverLive").catch( err => ctx.err = err.message /* TODO check if change is registerd in test file or exlude from test*/) },
        {   title: "git checkout -",                                                   task: ()     => git().checkout("-") }, 
        {   title: "git stash pop",                         skip: ctx => !ctx.stash,   task: ()     => git().stash(["pop"]) }, 
        {   title: "Process error",                         enabled: ctx => ctx.err,   task: (ctx)  => { throw new Error(ctx.err)} }, 
    ],{
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    })
}
exports.validateTestingConditions = validateTestingConditions