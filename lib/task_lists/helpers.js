const Listr = require('listr');
const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const readline = require('readline');

const cobProducts = ["recordm", "integrationm", "recordm-importer", "logm", "userm", "devicem"];

/* ************************************ */
function setupGitHooks(projectName) {
    let windows = false; /*TODO: eval if we're on Windows*/
    
    process.chdir(".git/hooks");
    /* both @commitlint cli and configuration are dependencies of the cob-cli package. Using the full path to them. */
    fs.writeFileSync('commit-msg', ""
        + (windows ? "#!C:/Program\ Files/Git/usr/bin/sh.exe" : "#!/bin/sh")
        + "\n\n"
        + "node " + path.resolve(__dirname, "../../node_modules/@commitlint/cli/lib/cli.js") + " -g " + path.resolve(__dirname, "../../node_modules/@commitlint/config-conventional/index.js") + "  -e \"$1\" \n");
    fs.chmodSync('commit-msg', "0755");
    process.chdir("../..");
}

/* ************************************ */
function cobSemanticRelease() {
    return execa("node", [
        path.resolve(__dirname, '../../node_modules/semantic-release/bin/semantic-release.js'),
        "-e", path.resolve(__dirname, 'deploy_semanticReleaseConfiguration.js'),
        "--no-ci"
    ]);
}

/* ************************************ */
/* syncFilesTasks executionType: */
syncFilesTasks.TEST = "Test equality only"
syncFilesTasks.COPY = "Copy"

function syncFilesTasks(server, from, to, executionType) {
    let tasks = [];
    cobProducts.forEach(function (product) {
        let fromPath = _cobResolvePath(server, from, product);
        let toPath   = _cobResolvePath(server, to,   product);

        tasks.push({
            title: executionType + " " + product + " " + from + " to " + to,
            task: (ctx, task) => 
                _cobReleventRsync(fromPath, toPath, executionType)
                .then((value) => {
                    let result = _formatRsyncOutput(value.stdout).join("\n")
                    if (executionType == syncFilesTasks.TEST && result != "") {
                        let errors = [
                            "Compared to the production copy of '" + product + "/master', local checkout has:",
                            result,
                            "\n Either some version(s) of master where not deployed or your copy of master is not updated",
                            " You have 2 options: either choose the server version or the local version. ",
                            // "\t (TODO: Give options like 'cob-cli redeploy' or 'cob-cli reset-project')",
                            "Error:".bgRed + " Deployed checkout is different from local/master checkout"
                        ];
                        git().checkout("master"); // get back to master branch, for the cases we're not there
                        throw new Error(errors.join("\n"));
                    }
                })
                .catch((err) => {
                    if (err.exitCode != 12 && err.exitCode != 23) throw err; /* 12 & 23 indicam que directorias não existem */
                    task.skip('Not present');
                })
        });
    });
    return new Listr(tasks, { concurrent: true });
}

/* ************************************ */
async function getDiffs(server) {
    let changeCount = 0
    for(let i= 0; i < cobProducts.length; i++) {
        let product = cobProducts[i]
        let fromPath = _cobResolvePath(server, "localMaster",    product);
        let toPath   = _cobResolvePath(server, "productionLive", product);
        
        console.log(" " + product + "...")

        await _cobReleventRsync(fromPath, toPath, syncFilesTasks.TEST)
        .then((value) => {
            let result = _formatRsyncOutput(value.stdout).join("\n")
            if (result) {
                console.log(result)
                changeCount++
            }
        })
        .catch((err) => {
            if (err.exitCode != 12 && err.exitCode != 23) throw err; /* 12 & 23 é a indicar que directorias não existem */
        })
    };
    return changeCount
}

/* ************************************ */
function _formatRsyncOutput(rsyncOutput) {
    let results = rsyncOutput
        .split("\n")
        .slice(1, -3) // O Header e o Footer não interessam
        .filter(line => !line.endsWith("/")) // diferenças nos settings das directorias não interessam
        .filter(line => !line.endsWith("is uptodate")) // ficheiros inalterados não interessam
        .map(line => "\t " + (line.startsWith("deleting") ? line.red : ("add/change " + line).green))  // colorir e complementar cada diferença
    return results
}

/* ************************************ */
function _cobReleventRsync(fromPath, toPath, executionType) {
    return execa('rsync', [
        fromPath,
        toPath,
        "-aczv",
        "--delete",
        "--exclude=db",
        "--exclude=node_modules",
        "--exclude=build",
        "--exclude=uploaded",
        "--exclude=.processed",
        "--exclude=.failed",
        "--exclude=recordm-importer.log*",
        "--exclude=recordm-importer*.jar",
        "--exclude=.git",
        "--exclude=.DS_Store",
        executionType == syncFilesTasks.COPY ? "-v" : "--dry-run"
    ]);
}

/* ************************************ */
function _cobResolvePath(server, type, product) {
    switch (type) {
        case "localMaster":
            return path.resolve(".") + "/" + product + "/";

        case "productionMaster":
            return server + ":/opt/cob-cli.production.checkout/" + product + "/";

        case "productionDefault":
            return server + ":/opt/" + product + "/etc.default/";
            
        case "productionLive":
            return server + ":"
                + ((product == "recordm-importer")
                    ? "/opt/recordm-importer/"
                    : "/etc/" + product + "/");
    }
}

/* ************************************ */
function getServerName() {
    try {
        var data = fs.readFileSync('.server', 'utf8');
        return data;    
    } catch { 
        console.error ("\nError:".red,"'.server' file not found. This command should be run inside project directory.\n" )
    }       
}

/* ************************************ */
function getServer(serverName) {
    return serverName + ".cultofbits.com";
}

/* ************************************ */
function getKeypress() {
    process.stdin.setRawMode(true);
    readline.emitKeypressEvents(process.stdin);
    const rl = readline.createInterface({
        input: process.stdin
    });
    return new Promise(resolve => rl.input.on("keypress", (letter,key) => {        
        if(key.name == "return") {
            console.log("\n")          
        } else {
        rl.close();
            resolve(letter.toLowerCase());
        }
    }))
}

/* ************************************ */
module.exports = {
    cobProducts: cobProducts,
    setupGitHooks: setupGitHooks,
    cobSemanticRelease: cobSemanticRelease,
    syncFilesTasks: syncFilesTasks,
    getDiffs: getDiffs,
    getServerName: getServerName,
    getServer: getServer,
    getKeypress: getKeypress
};