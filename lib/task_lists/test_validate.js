require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { testEquality } = require("./helpers");
const { checkNoTestsRunningLocally } = require("../task_lists/test_otherFilesContiousReload");


function validateTestingConditions(server) {
    console.log("Checking testing conditions of", server.bold.blue );
    return new Listr([
        {   title: "Check there's no other 'cob-cli test' running locally",            task: ()     => checkNoTestsRunningLocally() },
        {   title: "git stash --include-untracked",                                    task: (ctx)  => git().stash(["--all"]).then( value => value.indexOf("Saved") == 0 && (ctx.stash = true)) }, 
        {   title: "git checkout latest tag",                                          task: ()     => git().checkoutLatestTag() }, 
        {   title: "Check latest tag == server copy",                                  task: (ctx)  => testEquality(server, "localMaster", "productionMaster").catch( err => ctx.err = err ) },
        {   title: "Check server copy == production files",                            task: (ctx)  => testEquality(server, "productionMaster", "productionLive").catch( err => ctx.err = err ) },
        {   title: "git checkout -",                                                   task: ()     => git().checkout("-") }, 
        {   title: "git stash pop",                         enabled: ctx => ctx.stash, task: ()     => git().stash(["pop"]) }, 
        {   title: "Process error",                         enabled: ctx => ctx.err,   task: (ctx)  => { throw ctx.err} }, 
    ])
}
exports.validateTestingConditions = validateTestingConditions