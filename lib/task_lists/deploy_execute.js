const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git/promise');
const { registerRelease } = require("./common_releaseManager");
const { copyFiles } = require("./common_syncFiles");


function executeTasks(env, args) {
    console.log("\nDeploying ...");

    return new Listr([
        {title: "Register release in DEPLOYLOG.md", task: () => registerRelease(env)},
        {title: `git push (branch: ${env.currentBranch})`, task: () => git().push("origin", env.currentBranch, {"--set-upstream": null})},
        {title: "Deploy files to server's live directories", task: () => copyFiles(env, "localCopy", "serverLive")}
    ], {
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    });
}
exports.executeTasks = executeTasks;