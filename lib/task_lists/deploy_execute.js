const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git/promise');
const { registerRelease } = require("./common_releaseManager");
const { copyFiles } = require("./common_syncFiles");


function executeTasks(server, args) {
    console.log("\nDeploying ...")
    return new Listr([
        { title: "Register release in CHANGELOG.md",              task: () => registerRelease(server) },
        { title: "git push origin master",                        task: () => git().push(["origin", "--all"]) }, 
        { title: "Deploy files to server's live directories",     task: () => copyFiles(server, "localCopy", "serverLive") }
    ],{
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
        collapse: false
    })
}
exports.executeTasks = executeTasks;