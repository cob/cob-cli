require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { checkWorkingCopyCleanliness, testEquality } = require("./helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")


function validateDeployConditions(server, args) {
    console.log("\nChecking conditions to deploy to", server.bold.blue, "..." );

    return new Listr([
        {   title: "Update with origin: git fetch origin",                                            task: () => git().fetch()   },
        {   title: "Check there're no 'cob-cli test' running on server",                              task: () => checkNoTestsRunningOnServer(server) },
        {   title: "Check git status",                                                                task: () => checkWorkingCopyCleanliness() }, 
        {   title: "find out branch-for-HEAD",               skip: ctx => args.force,                 task: (ctx)  => getCurrentBranch().then( currentBranch => ctx.currentBranch = currentBranch) }, 
        {   title: "find out SHA for last-deploy on server", skip: ctx => args.force,                 task: (ctx)  => getLastDeployedSha(server).then( lastSha => ctx.lastSha = lastSha) }, 
        {   title: "git checkout SHA-for-last-deploy",       skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => git().checkout(ctx.lastSha) }, 
        {   title: "Check last-deploy == serverLive".yellow, skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => testEquality(server, "localCopy", "serverLive").catch( err => { git().checkout(ctx.currentBranch); throw err}) },
        {   title: "git checkout branch-for-HEAD",           skip: ctx => !ctx.lastSha,               task: (ctx)  => git().checkout(ctx.currentBranch) },         
    ])
}

exports.validateDeployConditions = validateDeployConditions;