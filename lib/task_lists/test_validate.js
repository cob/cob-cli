require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git/promise');
const { testEquality, getCurrentBranch, getLastDeployedSha, getServerName, getServer } = require("./helpers");
const { checkNoTestsRunningLocally } = require("../task_lists/test_otherFilesContiousReload");


function validateTestingConditions(server, args) {
    let defaultserver = getServer(getServerName());
    let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";
    console.log("Checking test conditions for", serverStr );
    return new Listr([
        {   title: "Check there's no other 'cob-cli test' running locally".yellow,     task: ()     => checkNoTestsRunningLocally() }, // If there was more than 1 test running the stash would be mixed and the webpack ports would already be used
        {   title: "find out branch-for-HEAD",                                         task: (ctx)  => getCurrentBranch().then( currentBranch => ctx.currentBranch = currentBranch) }, 
        {   title: "find out SHA for last-deploy on specified server",                 task: (ctx)  => getLastDeployedSha(server).then(lastSha => { if (lastSha) { ctx.lastSha = lastSha } else { ctx.err = "No previous deploy to " + server.bold + " found in CHANGELOG.md.\n If it's a new server do " + ("cob-cli deploy -s " + server + " --force").yellow + " first, to initialize the server\n " + "Aborted:".bgRed + " no previous deploy detected on this server." } }) }, 
        {   title: "git stash --include-untracked",         skip: ctx => !ctx.lastSha, task: (ctx)  => git().stash(["--include-untracked"]).then( value => value.indexOf("Saved") == 0 && (ctx.stash = true)) }, 
        {   title: "git checkout SHA for last-deploy",      skip: ctx => !ctx.lastSha, task: (ctx)  => git().checkout(ctx.lastSha) }, 
        {   title: "Check last-deploy == serverLive".yellow,skip: ctx => !ctx.lastSha, task: (ctx)  => testEquality(server, "serverLive", "localCopy").catch( err => ctx.err = err.message ) },
        {   title: "git checkout branch-for-HEAD",          skip: ctx => !ctx.lastSha, task: (ctx)  => git().checkout(ctx.currentBranch) }, 
        {   title: "git stash pop",                         skip: ctx => !ctx.stash,   task: ()     => git().stash(["pop"]) }, 
        {   title: "Process errors found...",               enabled: ctx => ctx.err,   task: (ctx)  => checkErrors(ctx.err) }, 
    ],{
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    })
}
exports.validateTestingConditions = validateTestingConditions

function checkErrors(errors) {
    throw new Error(errors)
}