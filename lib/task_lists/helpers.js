const Listr = require('listr');
const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const git = require('simple-git/promise');
const readline = require('readline');

const COB_PRODUCTS = ["recordm", "integrationm", "recordm-importer", "userm", "confm", "others"];
const SERVER_COB_CLI_DIRECTORY = "/opt/cob-cli.production.checkout/"
const RSYNC_RETRIES = 10;
const CHANGELOGFILE = "CHANGELOG.md";

const DEBUG = false;

/* ************************************ */
function copyFiles(server, from, to) {
    return _syncFiles(_syncFiles.COPY, server, from, to)
}

/* ************************************ */
function testEquality(server, from, to) {
    return _syncFiles(_syncFiles.TEST, server, from, to)
}

/* ************************************ */
async function confirmExecutionOfChanges(server, extraOptions = []) {
    console.log("\nChecking changes... ")
    let changes = await _syncFiles(_syncFiles.DIFF, server,  "localCopy", "serverLive", extraOptions)
    if (changes.length) {
        let defaultserver = getServer(getServerName());
        let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";
        console.log("\nChanges that will be done in " + serverStr + ":");
        console.log(" " + changes.join("\n "));
        process.stdout.write( "\n Continue? [y/N] ".yellow.bold);
        let answer = await getKeypress();
        if (answer != "y") {
            throw new Error("Aborted by user:".brightYellow + " nothing done\n");
        }
    } else {
        console.log(" No changes found.");
    }
    return changes
}

/* **************************************************************************************** */
async function checkWorkingCopyCleanliness() {
    await git().status()
    .then(result => {
        // resultSample = {"not_added":[".server"],"conflicted":[],"created":[],"deleted":[],"modified":["a.js"],"renamed":[],"files":[{"path":"a.js","index":" ","working_dir":"M"},{"path":".server","index":"?","working_dir":"?"}],"staged":[],"ahead":0,"behind":0,"current":"test","tracking":"origin/test"}
        if (!result.isClean() || result.behind) {
            let errors = ["Please clean your working tree prior to deploy:"];

            if(result.behind) {
                errors.push( "\t You're behind of origin on this branch by " + result.behind + " commits")
                errors.push( "\t Consider doing a " + "git pull".brightBlue)
            }
            if(result.files.length) {
                errors.push(" Commit or stash your changes:");
                result.files.forEach( file => {
                    errors.push( "\t " + file.working_dir + " " + file.index + " " + file.path )
                })
            }
            errors.push("Error:".bgRed + " Unclean working tree")
            throw new Error(errors.join("\n"))
        }
    })
}

/* ************************************ */
async function syncFile(server, file) {
    let product = file.split("/")[0];
    let filePath = file.substring(file.indexOf("/") + 1);
    let remoteProductPath = _resolveCobPath(server, "serverLive", product);
    let fileDir = remoteProductPath.split(":")[1]  + filePath.substring(0,filePath.lastIndexOf("/") );
    let localFileDir = product + "/" + filePath.substring(0,filePath.lastIndexOf("/") );

    if(DEBUG) console.log("Start rsync " + filePath)
    await execa('ssh', [server,"mkdir -p " + fileDir ]);

    let count = 0;
    while(count < RSYNC_RETRIES) {
        await execa('rsync', [file, remoteProductPath + filePath, "-acz"])
        .then(count = RSYNC_RETRIES)
        .catch(async (err) => {
            // exitCode 23 indicam que o ficheiro não existe na origem. Temod de apagar no destino.
            if (err.exitCode == 23) {
                await execa('ssh', [server, "rm -f " + remoteProductPath.split(":")[1] + filePath]).catch ( {} )
                if(!fs.existsSync(localFileDir)) {
                    if(DEBUG) console.log(localFileDir + " needs to be removed")
                    await execa('ssh', [server, "rmdir " + fileDir ]).catch({ });
                }

                count = RSYNC_RETRIES;
            } else if(count > RSYNC_RETRIES) {
                if(DEBUG) console.log("rsync '" + filePath + "': failed with " + err.exitCode + " -> " +err.message)
                throw err
            } else {
                if(DEBUG) console.log("rsync '" + filePath + "': attempt " + (count+1) + " failed with code " + err.exitCode)
            }
        });
        count++
    }
}

/* ************************************ */
_syncFiles.TEST = "Test equality"
_syncFiles.DIFF = "Get differences"
_syncFiles.COPY = "Copy"
_syncFiles.excludeOptions = [
    "--exclude=health.conf", //TMP
    "--exclude=db",
    "--exclude=node_modules",
    "--exclude=uploaded",
    "--exclude=.processed",
    "--exclude=.failed",
    "--exclude=recordm-importer.log*",
    "--exclude=recordm-importer*.jar",
    "--exclude=.git",
    "--exclude=.gitkeep",
    "--exclude=security",
    "--exclude=hornetq",
    "--exclude=elasticsearch",
    "--exclude=reports",
    "--exclude=*.rc",
    "--exclude=*.iml",
    "--exclude=.swap",
    "--exclude=.DS_Store",
    "--exclude=.env.json",
    "--exclude=.idea"
];

/* ************************************ */
async function _syncFiles(executionType, server, from, to, extraOptions = []) {
    let changes = []
    let requests = COB_PRODUCTS.map( product => {
        return new Promise( async (resolve, reject) => {
            let fromPath = _resolveCobPath(server, from, product);
            let toPath   = _resolveCobPath(server, to,   product);

            if(from != "serverLive" && executionType == _syncFiles.COPY && !fs.existsSync(product)) {
                resolve()
                return;
            }
        
            execa('ssh', [server,"mkdir -p /opt/cob-cli.production.checkout"]);

            let count = 0;
            while(count < RSYNC_RETRIES) {
                if(DEBUG) console.log("rsync '" + product + "': attempt " + (count+1) )
                await execa('rsync',  
                    [
                        fromPath,
                        toPath,
                        "-acvi",
                        "--delete",
                        executionType == _syncFiles.COPY ? "-v" : "--dry-run"
                    ].concat(_syncFiles.excludeOptions, extraOptions ),
                    { shell: true, env: {"RSYNC_RSH": "ssh -v -o ConnectTimeout=30 -o ServerAliveInterval=30 -o ServerAliveCountMax=30"} }
                )
                .then( (value) => {
                    if(DEBUG) console.log("rsync '" + product + "': success " + value.stdout )
                    
                    let result = _formatRsyncOutput(product,value.stdout)
                    if(DEBUG) console.log("rsync '" + product + "': success " + result )
                    changes = changes.concat(result)
                    count = RSYNC_RETRIES;

                    resolve()
                })
                .catch( (err) => {
                    /* 23 é a indicar que directorias não existem, ie, não é um problema por isso não devolve erro */
                    if (err.exitCode == 23) {
                        count = RSYNC_RETRIES;
                        resolve()
                    } else if(count > RSYNC_RETRIES) {
                        reject(new Error( err ));; 
                    } else {
                        if(DEBUG) console.log("rsync '" + product + "': attempt " + (count+1) + " failed with code " + err.exitCode)
                    }
                })
                count++
            }
        })
    })
    await Promise.all(requests).catch( err => { throw new Error(err.message)} )

    if (executionType == _syncFiles.TEST && changes.length != 0) {
        let errors = [
            ("There are diferences between " + from + " and " + to + ".").red,
            " In " + from + " someone...",
            "  " + changes.join("\n  "),
            "",
            " ServerLive needs to be equal to lastDeploy. Either fix the problem manually or:",
            "  1) if necessary clean up local repo (probably using " +"git stash --include-untracked".yellow + ")",
            "  2) run " + "cob-cli updateFromServer [--server <servername>]".yellow,
            "  3) check and fix the changes",
            "  4) commit the result",
            "  5) run " + "cob-cli deploy --force [--server <servername>]".yellow,
            "  6) if necessary restore your previous changes (probably with " + "git stash pop".yellow + ")",
            "",
            "Error:".bgRed + " Latest version deployed differs from current serverLive"
        ];
        throw new Error(errors.join("\n"));
    }
    return changes
}

/* ************************************ */
function _formatRsyncOutput(product,rsyncOutput) {
    return rsyncOutput
        .split("\n")
        .slice(1, -3) // O Header e o Footer não interessam
        .filter(line => /^[*<>]/.test(line)) // Só interessam linhas de mudança (ie, * ou > ou < )
        .map(line => {
            let linePart = line.split(" ")
            if(linePart[0] == "*deleting")    return "delete".brightRed + " " + product + "/" + linePart[1]
            if(linePart[0].startsWith("<fc")) return "change".brightYellow + " " + product + "/" + linePart[1]
            if(linePart[0].startsWith(">fc")) return "changed".brightYellow + " " + product + "/" + linePart[1]
            if(linePart[0].startsWith("<f+")) return "create".brightGreen + " " + product + "/" + linePart[1]
            if(linePart[0].startsWith(">f+")) return "created".brightGreen + " " + product + "/" + linePart[1]
        })
}

/* ************************************ */
function _resolveCobPath(server, type, product) {
    switch (type) {
        case "localCopy":
            return path.resolve(".") + "/" + product + "/";

        case "serverInitial":
            return server + ":/opt/" + product + "/etc.default/";

        case "serverLive":
            switch (product) {
                case "recordm-importer":
                case "others":
                    return server + ':' + "/opt/" + product + "/"
                default:
                    return server + ':' + "/etc/"  + product + "/"
            }
    }
}

/* ************************************ */
function getLastDeployedSha(server) {
    let originalChangeLog;
    let lastSha = "";

    try {
        originalChangeLog = fs.readFileSync(CHANGELOGFILE).toString(); //TODO: consider getting file from server instead
    } catch (e) {
        // we're assuming non-existing file, so procedd with default empty originalChangeLog
    }
    
    const matchRegex = new RegExp(`# Deploy (.*) to ${server}\n`);
    let matchResult = originalChangeLog.match(matchRegex) 

    if (matchResult) {
        lastSha = matchResult[1];
    }

    return new Promise(resolve => resolve(lastSha) )
}

/* ************************************ */
function getCurrentBranch() {
    return git().revparse(["--abbrev-ref","HEAD"])
}

/* ************************************ */
function getCurrentSha() {
    return git().revparse(["--short","HEAD"])
}

/* ************************************ */
async function registerRelease(server) {
    var lastSha = ""
    var diffs = ""
    var originalChangeLog = ""
    const user = require('whoami');
    const date = new Date();
    var currentBranch = await getCurrentSha();
    
    try {
        originalChangeLog = fs.readFileSync(CHANGELOGFILE).toString(); //TODO: consider getting file from server instead
    } catch (e) {
        // we're assuming non-existing file, so procedd with default empty originalChangeLog
    }
    
    const newDeployText = `# Deploy ${currentBranch} to ${server}\n` 
        + `\n Deployed by ${user}`
        + `\n ${date}\n`
    const matchRegex = new RegExp(`# Deploy (.*) to ${server}\n`);
    let matchResult = originalChangeLog.match(matchRegex) 

    if (!matchResult) {
        diffs = "\n * __First deploy__"
    } else {
        lastSha = getLastDeployedSha(server);
        if (lastSha != currentBranch) { // Only if diferent SHA, otherwise wont do anything, it's a re-deploy
            let gitLog = (await git().log([lastSha + ".." + currentBranch]).then(result => result))
            if (gitLog.all.length) {
                for (let i = 0; i < gitLog.all.length; i++) {
                    if (gitLog.all[i].message.match(new RegExp(`chore: Deploy (.*) to (.*)$`))) {
                        // Don't include deploy lines in diffs
                        continue;
                    }
                    diffs = diffs
                        + "\n * "
                        + gitLog.all[i].date
                        + ": "
                        + gitLog.all[i].message
                }
            }
        }
    }

    if (diffs) {
        let newChangeLog = newDeployText + diffs + "\n\n" + originalChangeLog;
        fs.writeFile(CHANGELOGFILE, newChangeLog, function (err) {
            if (err) {
                throw new Error("\nError:".red + " Failed to write changeLog.\n")
            }
        });

        await git().add([CHANGELOGFILE])
        await git().commit([newDeployText.replace("#", "chore:")])
    }
}

/* ************************************ */
function getServerName() {
    try {
        var data = fs.readFileSync('.server', 'utf8');
        return data;
    } catch {
        throw new Error("\nError:".red + " file " + ".server".blue.bold + " not found. This command should be run inside project directory.\n" )
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
            console.log("")
        } else {
        rl.close();
            resolve(letter && letter.toLowerCase() || key.name);
        }
    }))
}

/* ************************************ */
module.exports = {
    SERVER_COB_CLI_DIRECTORY: SERVER_COB_CLI_DIRECTORY,
    checkWorkingCopyCleanliness: checkWorkingCopyCleanliness,
    copyFiles: copyFiles,
    syncFile: syncFile,
    testEquality: testEquality,
    confirmExecutionOfChanges: confirmExecutionOfChanges,
    registerRelease: registerRelease,
    getCurrentBranch: getCurrentBranch,
    getLastDeployedSha: getLastDeployedSha,
    getServerName: getServerName,
    getServer: getServer,
    getKeypress: getKeypress
};
