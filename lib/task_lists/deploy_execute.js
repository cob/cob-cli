const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git/promise');
const { registerRelease } = require("./common_releaseManager");
const { copyFiles } = require("./common_syncFiles");


function executeTasks(cmdEnv, args) {
    console.log("\nDeploying ...");

    return new Listr([
        {title: "Register release in DEPLOYLOG.md", task: () => registerRelease(cmdEnv)},
        {title: `git push (branch: ${cmdEnv.currentBranch})`, task: () => git().push("origin", cmdEnv.currentBranch, {"--set-upstream": null})},
        {title: "Deploy files to server's live directories", task: () => copyFiles(cmdEnv, "localCopy", "serverLive")}
    ], {
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    });
}
exports.executeTasks = executeTasks;