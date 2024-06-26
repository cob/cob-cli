require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git');
const { checkWorkingCopyCleanliness, checkConnectivity } = require("./common_helpers");
const { getCurrentBranch, getLastDeployedSha } = require("./common_releaseManager");
const { testEquality } = require("./common_syncFiles");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")


function validateDeployConditions(cmdEnv, args) {
    return new Listr([
        {   title: "Check connectivity and permissions".bold,                                                           task: ()     => checkConnectivity(cmdEnv.server) },
        {   title: "Check git status".bold,                                                                             task: ()     => checkWorkingCopyCleanliness(false) }, 
        {   title: "Check there's no 'cob-cli test' running on server".bold,                                            task: ()     => checkNoTestsRunningOnServer(cmdEnv.server) },
        {   title: "find out branch-for-HEAD",                                 skip: ()  => args.force,                 task: (ctx)  => getCurrentBranch().then( currentBranch => ctx.currentBranch = currentBranch ) }, 
        {   title: "find out SHA for last-deploy on specified server",         skip: ()  => args.force,                 task: (ctx)  => getLastDeployedSha(cmdEnv.server).then(lastSha => _handleGetLastDeployedSha(ctx, cmdEnv, lastSha)) }, 
        {   title: "git checkout SHA-for-last-deploy",                         skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => git().checkout(ctx.lastSha) }, 
        {   title: "Apply last enviroment specifics".bold,                     skip: ctx => args.force || !ctx.lastSha, task: ()     => cmdEnv.applyLastEnvironmentDeployedToServerChanges() },
        {   title: "Check last-deploy == serverLive".bold,                     skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => testEquality(cmdEnv, "localCopy", "serverLive", args).then( changes => _handleTestEquality(ctx, changes)) },
        {   title: "Undo last enviroment specifics".bold,                      skip: ctx => args.force || !ctx.lastSha, task: ()     => cmdEnv.unApplyLastEnvironmentDeployedToServerChanges() },
        {   title: "git checkout branch-for-HEAD",                             skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => git().checkout(ctx.currentBranch) },
        {   title: "report problems",                                          enabled: ctx => ctx.err,                 task: (ctx)  => {throw new Error(ctx.err)} },
    ],{
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    })
}

exports.validateDeployConditions = validateDeployConditions;

/* ************************************ */
function _handleGetLastDeployedSha(ctx, cmdEnv, lastSha) {
    if (lastSha) { 
        ctx.lastSha = lastSha 
    } else { 
        ctx.err = 
            "No previous deploy to " 
            + cmdEnv.server.bold 
            + " found.\n If it's a new server do " 
            + ("cob-cli deploy -s " + cmdEnv.servername + " --force").yellow 
            + " first, to initialize the server\n\n " 
            + "Aborted:".bgRed + " no previous deploy detected on this server." 
            + "\n"
    } 
}

/* ************************************ */
function _handleTestEquality(ctx, changes) {
    if (changes.length != 0) {
        ctx.err = [
            ("There are diferences between localCopy and serverLive.").red,
            " In localCopy someone...",
            "  " + changes.join("\n  "),
            "",
            " ServerLive needs to be equal to lastDeploy. Either fix the problem manually or:",
            "  1) clean up local repo (only if necessary and probably using " + "git stash --include-untracked".yellow + ")",
            "  2) run " + "cob-cli updateFromServer [--servername <servername>]".yellow,
            "  3) check and fix the changes",
            "  4) commit the result",
            "  5) run " + "cob-cli deploy --force [--servername <servername>]".yellow,
            "  6) restore your previous changes (if you followed step 1 then use " + "git stash pop".yellow + ")",
            "",
            "Error:".bgRed + " Latest version deployed differs from current serverLive"
        ].join("\n");
    }
}
