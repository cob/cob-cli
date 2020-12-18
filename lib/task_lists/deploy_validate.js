require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const execa = require('execa');
const git = require('simple-git/promise');
const { checkWorkingCopyCleanliness, checkConnectivity } = require("./common_helpers");
const { getCurrentBranch, getLastDeployedSha } = require("./common_releaseManager");
const { testEquality } = require("./common_syncFiles");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")


function validateDeployConditions(server, args) {
    return new Listr([
        {   title: "Check connectivity and permissions".bold,                                                           task: ()     => checkConnectivity(server) },
        {   title: "Update with origin: git fetch origin",                                                              task: ()     => git().fetch(["--tags"])   },
        {   title: "Check git status".bold,                                                                             task: ()     => checkWorkingCopyCleanliness() }, 
        {   title: "Check there're no 'cob-cli test' running on server".bold,                                           task: ()     => checkNoTestsRunningOnServer(server) },
        {   title: "find out branch-for-HEAD",                                 skip: ctx => args.force,                 task: (ctx)  => getCurrentBranch().then( currentBranch => _handleGetCurrentBranch(ctx, currentBranch) ) }, 
        {   title: "find out SHA for last-deploy on specified server",         skip: ctx => args.force,                 task: (ctx)  => getLastDeployedSha(server).then(lastSha => _handleGetLastDeployedSha(ctx, server, lastSha)) }, 
        {   title: "git checkout SHA-for-last-deploy",                         skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => git().checkout(ctx.lastSha) }, 
        {   title: "Check last-deploy == serverLive".bold,                     skip: ctx => args.force || !ctx.lastSha, task: (ctx)  => testEquality(server, "localCopy", "serverLive").then( changes => _handleTestEquality(ctx, changes)) },
        {   title: "git checkout branch-for-HEAD",                             skip: ctx => !ctx.lastSha,               task: (ctx)  => git().checkout(ctx.currentBranch) },         
    ],{
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    })
}

exports.validateDeployConditions = validateDeployConditions;

/* ************************************ */
function _handleGetCurrentBranch(ctx, currentBranch) {
    if(currentBranch) { 
        ctx.currentBranch = currentBranch 
    } else { 
        throw new Error("Aborded:".red + " git head is dettached") 
    }
}

/* ************************************ */
function _handleGetLastDeployedSha(ctx, server, lastSha) {
    if (lastSha) { 
        ctx.lastSha = lastSha 
    } else { 
        ctx.err = 
            "No previous deploy to " 
            + server.bold 
            + " found.\n If it's a new server do " 
            + ("cob-cli deploy -s " + server.substring(0,server.indexOf(".")) + " --force").yellow 
            + " first, to initialize the server\n " + "Aborted:".bgRed + " no previous deploy detected on this server." 
    } 
}

/* ************************************ */
function _handleTestEquality(ctx, changes) {
    if (changes.length != 0) {
        git().checkout(ctx.currentBranch);
        let errors = [
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
        ];
        throw new Error(errors.join("\n"));
    }
}