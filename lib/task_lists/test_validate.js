require('colors');
const Listr = require('listr');
const execa = require('execa');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const git = require('simple-git/promise');
const { getServerName, getServer, checkConnectivity } = require("./common_helpers");
const { getCurrentBranch, getLastDeployedSha } = require("./common_releaseManager");
const { testEquality } = require("./common_syncFiles");
const { SERVER_IN_PROGRESS_TEST_FILE } = require("../task_lists/test_otherFilesContiousReload");


async function validateTestingConditions(server, args) {
    let defaultserver = getServer(getServerName());
    let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";
    console.log("Checking test conditions for", serverStr );
    let result = await new Listr([
            {   title: "Check connectivity and permissions".bold,                          task: ()     => checkConnectivity(server) },
            {   title: "Check there's no other 'cob-cli test' running locally".bold,       task: ()     => checkNoTestsRunningLocally() },
            {   title: "find out branch-for-HEAD",                                         task: (ctx)  => getCurrentBranch().then( currentBranch => ctx.currentBranch = currentBranch) },
            {   title: "find out SHA for last-deploy on specified server",                 task: (ctx)  => _handleGetLastDeployedSha(server).then( lastSha => ctx.lastSha = lastSha).catch( err => ctx.err = err ) },
            {   title: "git stash --include-untracked",         skip: ctx => !ctx.lastSha, task: (ctx)  => git().stash(["--include-untracked"]).then( value => value.indexOf("Saved") == 0 && (ctx.stash = true)) },
            {   title: "git checkout SHA for last-deploy",      skip: ctx => !ctx.lastSha, task: (ctx)  => git().checkout(ctx.lastSha) },
            {   title: "Check last-deploy == serverLive".bold,  skip: ctx => !ctx.lastSha, task: (ctx)  => testEquality(server, "serverLive", "localCopy").catch( err => ctx.err = err.message ) },
            {   title: "git checkout branch-for-HEAD",          skip: ctx => !ctx.lastSha, task: (ctx)  => git().checkout(ctx.currentBranch) },
            {   title: "git stash pop",                         skip: ctx => !ctx.stash,   task: ()     => git().stash(["pop"]) },
            {   title: "Warn diferences found...",              enabled: ctx => ctx.err,   task: (ctx)  => ctx.err },
        ],{
            renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
            collapse: false
        })
        .run()

    if(result.err) {
        let filesMsg = result.err.substring(result.err.indexOf("\n  ")+1,result.err.indexOf("\n\n"))
        let offendingFiles = filesMsg.split("\n").map(f => f.substring(20)) //20 é a posição onde começa o nome dos ficheiros em cada linha
        for(let i = 0; i< offendingFiles.length;i++) {
            changedFile = offendingFiles[i];
            await execa('ssh', [server, "grep -F " + changedFile + " " + SERVER_IN_PROGRESS_TEST_FILE ])
            .catch( () => { 
                throw new Error("Aborted:".red + " there's at least one file on the server diferent from last deploy that wasn't changed by a current test: " + changedFile.blue +  "\n" );
             } ) /* grep returns error if no match and execa throws an excepcions when return is error */                
        }
        let inTest = "";
        await execa('ssh', [server, "cat " + SERVER_IN_PROGRESS_TEST_FILE])
        .then( value => inTest = value.stdout )
        .catch( () => { } ) /* grep returns error if no match and execa throws an excepcions when return is error */
        .finally( async () => {
            if (inTest != "" ) {
                console.log("\nATTENTION: notice that there are tests running and changed files:".yellow.bold)
                console.log(" * " + inTest.yellow.replace(/\n/g,"\n * "))
                console.log("Local changes to these files will not be synched.\n".yellow.bold)
            }
        })           
    }    
}
exports.validateTestingConditions = validateTestingConditions

/* ************************************ */
function _handleGetLastDeployedSha(server) {
    return new Promise(async (resolve, reject) => {
        getLastDeployedSha(server)
            .then(lastSha => {
                if (lastSha) {
                    resolve(lastSha)
                } else {
                    reject(new Error(                        
                        "No previous deploy to "
                            + server.bold
                            + " found.\n"
                            + " Do "
                            + ("cob-cli deploy -s "
                                + server.substring(0, server.indexOf("."))
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
function checkNoTestsRunningLocally() {
    // If there is more than 1 test running, the stash would be mixed and the webpack ports would already be in used, so prevent this
    try {
        fs.readFileSync('.'+IN_PROGRESS_TEST_FILE, 'utf8');
    } catch { 
        return true;    
    }       
    throw new Error("\nAborted:".red + " file " + ("." + IN_PROGRESS_TEST_FILE).blue + " exists. You're problably running 'cob-cli test' on another console.\n" )
}