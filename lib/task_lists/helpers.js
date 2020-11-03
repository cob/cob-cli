const Listr = require('listr');
const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const git = require('simple-git/promise');
const readline = require('readline');

const COB_PRODUCTS = ["recordm", "integrationm", "recordm-importer", "userm", "confm", "others"];
const SERVER_COB_CLI_DIRECTORY = "/opt/cob-cli.production.checkout/"
const RSYNC_RETRIES = 10;

const DEBUG = false;

/* ************************************ */
function copyFiles(server, from, to) {
    return _syncFiles(_syncFiles.COPY, server, from, to)
}

/* ************************************ */
function testEquality(server, from, to) {
    if(from == "serverLive" && to == "serverCopy"
        || to == "serverLive" && from == "serverCopy" ) {
            return _checkLiveEqualsDeployed(server)
    }
    return _syncFiles(_syncFiles.TEST, server, from, to)
}

/* ************************************ */
async function confirmExecutionOfChanges(server, extraOptions = []) {
    console.log("\nChecking changes... ")
    let changes = await _syncFiles(_syncFiles.DIFF, server,  "localCopy", "serverLive", extraOptions)
    if(changes.length) {
        console.log("Continuing will change these files in production (live) :");
        console.log(" " + changes.join("\n "));
        process.stdout.write( " " + " Continue? [y/N] ".bgYellow.bold + " ");
        let answer = await getKeypress();
        if (answer != "y") {
            throw new Error("Aborted by user:".brightYellow + " nothing done\n");
        }
    }
    return changes
}

/* **************************************************************************************** */

function checkInMaster() {
    return git()
    .revparse(["--abbrev-ref","HEAD"])
    .then( result => {
        if(result != "master") {
            let errors = [
                "You're currently not in 'master' branch. Deploy must be made from 'master''.",
                "\t Do " + "git checkout master".brightBlue + " before running this command.",
                "\t If you made changes in another branch merge those changes to master ",
                "Error:".bgRed + " You must deploy from 'master'."
            ];
            throw new Error(errors.join("\n"))
        }
    })
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
            "There are diferences between locations. Copying the files from " + from + " to " + to + " would:",
            "  " + changes.join("\n  "),
            "\n Either last deploy had problems or server copy of last deploy was locally changed",
            // "\t (TODO: Give options like 'cob-cli redeploy' or 'cob-cli reset-project')",
            "Error:".bgRed + " Latest version deployed differ from server copy"
        ];
        throw new Error(errors.join("\n"));
    }
    return changes
}

/* **************************************************************************************** */

async function _checkLiveEqualsDeployed(server) {
    let changes = []
    let requests = COB_PRODUCTS.map( product => {
        return new Promise( (resolve, reject) => {
            let livePath = (product === "recordm-importer" || product === "others")
                                ? "/opt/" + product + "/"
                                : "/etc/" + product + "/";
            execa('ssh', [
                            server,
                            "colordiff -r",
                            SERVER_COB_CLI_DIRECTORY + product + "/" ,
                            livePath
                         ].concat(_syncFiles.excludeOptions)
            )
            .then((value) => {
                if(value.stdout) {
                    changes = changes.concat(value.stdout.split("\n"))
                    reject(new Error( changes ));;
                } else {
                    resolve()
                }
            })
            .catch((err) => {
                if(err.stdout) {
                    changes = changes.concat(err.stdout.split("\n"))
                    reject(new Error( changes ));;
                } else {
                    resolve()
                }
            })
        })
    })
    await Promise.all(requests).catch( err => {} )

    if (changes.length != 0) {
        let errors = [
            "Live files are different from the copy of last deploy stored on production",
            " This problably means someone changed live files outside the standard deployment process.",
            // "\t(TODO: Give options like 'cob-cli redeploy' or 'cob-cli reset-project') ",
            " The offending files are:",
            changes.map( line => "\t "+line).join("\n"),
            "Error:".bgRed + " Live differs from last deploy"
        ]
        throw new Error(errors.join("\n"))
    }

    return;
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

        case "serverCopy":
            return server + ":" + SERVER_COB_CLI_DIRECTORY + product + "/";

        case "productionDefault":
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
async function semanticRelease(server) {

    // Todo:
    // Add to CHANGELOG.md >>  * <git log SHA-old..SHA-new
    // git add changelog.md
    // git commit changelog.md -m "deployed sha to server ABC"
    // git push

    const changeLogFile = "x.md";

    const user = require('whoami');
    const date = new Date();
    const currentSha = await git().revparse(["--short","HEAD"]).then(result => result);

    const newDeployText = `# ${currentSha}@${server}: deployed by ${user} in ${date}`;
    var final = newDeployText
    var lastSha = ""
    
    try {
        var data = fs.readFileSync(changeLogFile).toString().split("\n");
        lastSha = data[0].match(new RegExp("# (.+)@" + server + ": deployed "))[1]
        lastSha += git.log(...)
        data.splice(0, 0, newDeployText + " previous: " + lastSha);
        final = data.join("\n");
    } catch(e) { 
        console.log(e)
    }

    fs.writeFile(changeLogFile, final, function (err) {
        if (err) return err;
    });
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
    checkInMaster: checkInMaster,
    checkWorkingCopyCleanliness: checkWorkingCopyCleanliness,
    copyFiles: copyFiles,
    syncFile: syncFile,
    testEquality: testEquality,
    confirmExecutionOfChanges: confirmExecutionOfChanges,
    setupGitHooks: setupGitHooks,
    semanticRelease: semanticRelease,
    getServerName: getServerName,
    getServer: getServer,
    getKeypress: getKeypress
};
