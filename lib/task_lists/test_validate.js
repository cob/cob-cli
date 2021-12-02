require('colors');
const Listr = require('listr');
const execa = require('execa');
const fs = require('fs-extra');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git/promise');
const { checkConnectivity } = require("./common_helpers");
const { getCurrentBranch, getLastDeployedSha } = require("./common_releaseManager");
const { testEquality } = require("./common_syncFiles");
const { SERVER_IN_PROGRESS_TEST_FILE } = require("../task_lists/test_otherFilesContiousReload");


async function validateTestingConditions(cmdEnv, args) {
    console.log("Checking test conditions for", cmdEnv.serverStr );
    let result = await new Listr([
            {   title: "Check connectivity and permissions".bold,                          task: ()     => checkConnectivity(cmdEnv.server) },
            {   title: "Check there's no other 'cob-cli test' running locally".bold,       task: ()     => _checkNoTestsRunningLocally() },
            {   title: "find out branch-for-HEAD",                                         task: (ctx)  => getCurrentBranch().then( currentBranch => ctx.currentBranch = currentBranch) },
            {   title: "find out SHA for last-deploy on specified server",                 task: (ctx)  => _getLastDeployedSha(cmdEnv).then( lastSha => ctx.lastSha = lastSha).catch( err => ctx.err = err ) },
            {   title: "git stash --include-untracked",         skip: ctx => !ctx.lastSha, task: (ctx)  => git().env('LC_ALL', 'C').stash(["--include-untracked"]).then( value => value.indexOf("Saved") == 0 && (ctx.stash = true)) },
            {   title: "git checkout SHA for last-deploy",      skip: ctx => !ctx.lastSha, task: (ctx)  => git().checkout(ctx.lastSha) },
            {   title: "Apply last enviroment specifics".bold,  skip: ctx => !ctx.lastSha, task: ()     => cmdEnv.applyLastEnvironmentDeployedToServerChanges() },
            {   title: "Check last-deploy == serverLive".bold,  skip: ctx => !ctx.lastSha, task: (ctx)  => testEquality(cmdEnv, "serverLive", "localCopy").then( changes => _handleTestEquality(ctx, changes, cmdEnv.server).catch( err => ctx.err = err.message )  ) },
            {   title: "Undo last enviroment specifics".bold,   skip: ctx => !ctx.lastSha, task: ()     => cmdEnv.unApplyLastEnvironmentDeployedToServerChanges() },
            {   title: "git checkout branch-for-HEAD",          skip: ctx => !ctx.lastSha, task: (ctx)  => git().checkout(ctx.currentBranch) },
            {   title: "git stash pop",                         skip: ctx => !ctx.stash,   task: ()     => git().stash(["pop"]) },
            {   title: "Warn diferences found...",              enabled: ctx => ctx.err,   task: (ctx)  => { throw new Error(ctx.err) } },
        ],{
            renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
            collapse: false
        })
        .run()

    if(result.testsWarning) console.log(result.testsWarning)
}
exports.validateTestingConditions = validateTestingConditions

/* ************************************ */
function _getLastDeployedSha(cmdEnv) {
    return new Promise(async (resolve, reject) => {
        getLastDeployedSha(cmdEnv.server)
            .then(lastSha => {
                if (lastSha) {
                    resolve(lastSha)
                } else {
                    reject(new Error(                        
                        "No previous deploy to "
                            + cmdEnv.servername.bold
                            + " found.\n"
                            + " Do "
                            + ("cob-cli deploy -s "
                                + cmdEnv.servername
                                + " --force"
                            ).yellow
                            + " to initialize the server.\n "
                            + "Aborted:".bgRed
                            + " no previous deploy detected on this server."
                    ));
                }
            })
    })
}

/* ************************************ */
function _checkNoTestsRunningLocally() {
    // If there is more than 1 test running, the stash would be mixed and the webpack ports would already be in used, so prevent this
    try {
        fs.readFileSync('.'+IN_PROGRESS_TEST_FILE, 'utf8');
    } catch { 
        return true;    
    }       
    throw new Error("\nAborted:".red + " file " + ("." + IN_PROGRESS_TEST_FILE).blue + " exists. You're problably running 'cob-cli test' on another console.\n" )
}

/* ************************************ */
async function _handleTestEquality(ctx, changes, server) {
    if (changes.length != 0) {
        let offendingFiles = changes.map(f => f.substring(17)) //17 é a posição onde começa o nome dos ficheiros em cada linha
        let problemFiles = [];
        for(let changedFile of offendingFiles) {
            await execa('ssh', [server, "grep -F " + changedFile + " " + SERVER_IN_PROGRESS_TEST_FILE ])
            .catch( () => { 
                try {
                    if (fs.lstatSync(changedFile.trim()).isFile()) {
                        problemFiles.push(changedFile.trim().red + " (changed or deleted)")
                    }
                } 
                catch {
                    problemFiles.push(changedFile.trim().green + " (added)")
                }
            } ) /* grep returns error if no match and execa throws an excepcions when return is error */                
        }
        if(problemFiles.length > 0)  throw new Error("Aborted:".red + " server was changed since last deploy:\n   " + problemFiles.join("\n   ") +  "\n" );

        let inTest = "";
        await execa('ssh', [server, "cat " + SERVER_IN_PROGRESS_TEST_FILE])
        .then( value => inTest = value.stdout )
        .catch( () => { } ) /* grep returns error if no match and execa throws an excepcions when return is error */
        .finally( async () => {
            if (inTest != "" ) {
                ctx.testsWarning = "\nATTENTION: notice that there are tests running with changed files on the server:\n".yellow.bold
                    + " * " + inTest.yellow.replace(/\n/g,"\n * ")
                    + "\n"
                    + "Local changes to these files will not be synched.\n".yellow.bold
            }
        })           
    }    
}
