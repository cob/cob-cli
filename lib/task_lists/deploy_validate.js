require('colors');
const Listr = require('listr');
const execa = require('execa');
const git = require('simple-git/promise');
const { checkWorkingCopyCleanliness, getCurrentBranch, getLastDeployedSha, testEquality, getServer, getServerName } = require("./helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")


function validateDeployConditions(server, args) {
    let defaultserver = getServer(getServerName());
    let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";

    console.log("Checking conditions to deploy to", serverStr, "..." );

    return new Listr([
        {   title: "Check connectivity and permissions".bold,                                         task: ()     => execa('ssh', [server, "touch /etc/recordm/recordm.rc"]) },
        {   title: "Update with origin: git fetch origin",                                            task: ()     => git().fetch()   },
        {   title: "Check git status".bold,                                                           task: ()     => checkWorkingCopyCleanliness() }, 
        {   title: "Check there're no 'cob-cli test' running on server".bold,                         task: ()     => checkNoTestsRunningOnServer(server) },
        {   title: "find out branch-for-HEAD",               skip: ctx => args.force,                 task: (ctx)  => getCurrentBranch().then( currentBranch => ctx.currentBranch = currentBranch) }, 
        {   title: "find out SHA for last-deploy on server", skip: ctx => args.force,                 task: (ctx)  => getLastDeployedSha(server).then( lastSha => ctx.lastSha = lastSha) }, 
        {   title: "git checkout SHA-for-last-deploy",       skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => git().checkout(ctx.lastSha) }, 
        {   title: "Check last-deploy == serverLive".bold,  skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => testEquality(server, "localCopy", "serverLive").catch( err => { git().checkout(ctx.currentBranch); throw err}) },
        {   title: "git checkout branch-for-HEAD",           skip: ctx => !ctx.lastSha,               task: (ctx)  => git().checkout(ctx.currentBranch) },         
    ])
}

exports.validateDeployConditions = validateDeployConditions;