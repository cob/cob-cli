const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const fs = require('fs');
const git = require('simple-git');
const { registerRelease } = require("./common_releaseManager");
const { copyFiles, decryptEncFiles, deploySolutions, listEncFileServerPaths } = require("./common_syncFiles");


function executeTasks(cmdEnv, args) {
    console.log("\nDeploying ...");
    let encFiles = [];

    // cc-install can prompt the user, so we force verboseRenderer if there's a solutions.yml
    const ccInstallWillRun = fs.existsSync('solutions.yml');

    return new Listr([
        {title: "Register release in DEPLOYLOG.md",           task: () => registerRelease(cmdEnv)},
        {title: `git push (branch: ${cmdEnv.currentBranch})`, task: () => git().push("origin", cmdEnv.currentBranch, {"--set-upstream": null})},
        {title: "Apply new enviroment specifics",             task: () => cmdEnv.applyCurrentCommandEnvironmentChanges() },
        {title: "Deploy files to server's live directories",  task: async () => {
            const result = await copyFiles(cmdEnv, "localCopy", "serverLive");
            encFiles = args.force ? listEncFileServerPaths(cmdEnv) : result.encFiles;
        }},
        {title: "Decrypt .enc files",                         skip: () => !encFiles.length, task: () => decryptEncFiles(cmdEnv, encFiles)},
        {title: "Deploy data",                                skip: () => !fs.existsSync('solutions.yml'), task: async () => {
            const ccInstallResult = await deploySolutions(cmdEnv.server);
            if (ccInstallResult.exitCode !== 0) throw new Error(`Deploying data failed (cc-install exit code ${ccInstallResult.exitCode}) — see cc-install output above`);
        }},
        {title: "Set last environment deployed",              task: () => cmdEnv.setLastEnvironmentDeployed()},
        {title: "Undo new enviroment specifics",              task: () => cmdEnv.unApplyCurrentCommandEnvironmentChanges() },
    ], {
        renderer: (args.verbose || ccInstallWillRun) ? verboseRenderer : UpdaterRenderer,
        collapse: false
    });
}
exports.executeTasks = executeTasks;
