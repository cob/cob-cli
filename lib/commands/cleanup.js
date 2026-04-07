require('colors');
const git = require('simple-git');
const fs = require('fs-extra');
const fg = require('fast-glob');
const execa = require('execa');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { SERVER_COB_CLI_DIRECTORY } = require("../task_lists/common_helpers");
const { loadOperationState, clearOperationState } = require("../task_lists/common_operationState");
const { checkRepoVersion } = require("../commands/upgradeRepo");

const LOCAL_TEST_LOCK_FILE = ".test.in.execution";
const SERVER_TEST_LOCK_FILE = SERVER_COB_CLI_DIRECTORY + "test.in.execution";

async function cleanup(args) {
    try {
        checkRepoVersion()

        const savedState = loadOperationState();
        if (savedState) {
            if (!args.environment) args.environment = savedState.environment;
            if (!args.servername)  args.servername  = savedState.servername;
        }

        console.log("Cleaning up interrupted test/deploy state...".bold)

        const cmdEnv = await getCurrentCommandEnviroment(args)
        console.log(`  environment: ${cmdEnv.name.bold}  server: ${cmdEnv.serverStr}`)

        await new Listr([
            {
                title: "Undo environment-specific file changes".bold,
                skip: async () => {
                    const backupFiles = await fg(
                        ['**/*.ENV__ORIGINAL_BACKUP__.*', '**/*.ENV__DELETE__.*'],
                        { onlyFiles: false, dot: true }
                    );
                    return backupFiles.length === 0 ? "No environment-specific changes found" : false;
                },
                task: () => cmdEnv.unApplyCurrentCommandEnvironmentChanges()
            },
            {
                title: "Restore git branch from detached HEAD".bold,
                skip: async () => {
                    const branch = await git().revparse(["--abbrev-ref", "HEAD"]);
                    return branch.trim() !== "HEAD" ? "Not in detached HEAD state" : false;
                },
                task: () => git().checkout("-")
            },
            {
                title: "Remove local test lock file".bold,
                skip: () => !fs.existsSync(LOCAL_TEST_LOCK_FILE) ? "No local test lock file found" : false,
                task: () => fs.unlinkSync(LOCAL_TEST_LOCK_FILE)
            },
            {
                title: "Remove server test lock file".bold,
                skip: () => args.localOnly ? "Skipping server cleanup (--localOnly)" : false,
                task: (ctx) => execa('ssh', [cmdEnv.server, "rm -f " + SERVER_TEST_LOCK_FILE])
                    .then(() => { ctx.serverCleaned = true; })
                    .catch(() => { ctx.serverUnreachable = true; })
            },
        ], {
            renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
            collapse: false
        }).run()

        clearOperationState()

        // Inform about stashes — don't auto-pop since user may have unrelated stashes
        const stashList = await git().stash(["list"]);
        if (stashList) {
            console.log("\n" + "Note:".yellow.bold
                + " Stashed changes detected (may be from the interrupted operation):")
            console.log(stashList.split("\n").slice(0, 3).map(l => "  " + l).join("\n"))
            console.log("Run " + "git stash pop".yellow + " if you want to restore your uncommitted changes.\n")
        }

        console.log("\nDone!".green, "\nYou can now run 'cob-cli test' or 'cob-cli deploy' again.")
        console.log("If files were changed during a test, run " + "cob-cli updateFromServer".yellow + " to resync.\n")

    } catch(err) {
        console.error("\n", err.message)
    }
}

module.exports = cleanup;
