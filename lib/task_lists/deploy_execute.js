const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git');
const { registerRelease } = require("./common_releaseManager");
const { copyFiles, decryptEncFiles } = require("./common_syncFiles");


function executeTasks(cmdEnv, args) {
    console.log("\nDeploying ...");
    let encFiles = [];

    return new Listr([
        {title: "Register release in DEPLOYLOG.md",           task: () => registerRelease(cmdEnv)},
        {title: `git push (branch: ${cmdEnv.currentBranch})`, task: () => git().push("origin", cmdEnv.currentBranch, {"--set-upstream": null})},
        {title: "Apply new enviroment specifics",             task: () => cmdEnv.applyCurrentCommandEnvironmentChanges() },
        {title: "Deploy files to server's live directories",  task: async () => { const result = await copyFiles(cmdEnv, "localCopy", "serverLive"); encFiles = result.encFiles; }},
        {title: "Decrypt .enc files",                         skip: () => !encFiles.length, task: () => decryptEncFiles(cmdEnv, encFiles)},
        {title: "Set last environment deployed",              task: () => cmdEnv.setLastEnvironmentDeployed()},
        {title: "Undo new enviroment specifics",              task: () => cmdEnv.unApplyCurrentCommandEnvironmentChanges() },
    ], {
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    });
}
exports.executeTasks = executeTasks;
