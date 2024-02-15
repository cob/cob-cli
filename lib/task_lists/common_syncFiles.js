const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const { getKeypress } = require("../task_lists/common_helpers");

/* ************************************ */
const COB_PRODUCTS = ["recordm", "integrationm", "recordm-importer", "reportm", "userm", "confm", "others"];
const DEBUG = false;
_syncFiles.TEST = "Test equality";
_syncFiles.DIFF = "Get differences";
_syncFiles.COPY = "Copy";

/* ************************************ */
function copyFiles(cmdEnv, from, to) {
    return _syncFiles(_syncFiles.COPY, cmdEnv, from, to);
} 
exports.copyFiles = copyFiles;

/* ************************************ */
async function testEquality(cmdEnv, from, to) {
    return (await _syncFiles(_syncFiles.TEST, cmdEnv, from, to)).filter( f => !f.endsWith("/"))
}
exports.testEquality = testEquality;

/* ************************************ */
async function _syncFiles(executionType, cmdEnv, from, to, extraOptions = []) {
    let changes = [];
    let products = cmdEnv.products.length ? cmdEnv.products : COB_PRODUCTS;
    let requests = products.map(product => {
        return new Promise(async (resolve, reject) => {
            let fromPath = resolveCobPath(cmdEnv.server, from, product);
            let toPath = resolveCobPath(cmdEnv.server, to, product);
            let productExtraOptions = extraOptions.map( option => option.replace(/=.*\|/,"="))
            productExtraOptions = productExtraOptions.filter( option => option.indexOf("|") < 0 )

            if (from != "serverLive" && executionType == _syncFiles.COPY && !fs.existsSync(product)) {
                resolve();
                return;
            }

            let count = 0;
            const RSYNC_RETRIES = 10;
            while (count < RSYNC_RETRIES) {
                if (DEBUG)
                    console.log("rsync '" + product + "': attempt " + (count + 1));
                await execa('rsync',
                    [
                        fromPath,
                        toPath,
                        "-acvi",
                        "--delete",
                        "--chmod=g+w",
                        "--perms",
                        "--filter='merge " + path.resolve(__dirname,"rsyncFilter-pre.txt") + "'",
                        cmdEnv.rsyncFilter ? "--filter='merge " + cmdEnv.rsyncFilter + "'" : "",
                        "--filter='merge " + path.resolve(__dirname,"rsyncFilter-post.txt") + "'",
                        executionType == _syncFiles.COPY ? "-v" : "--dry-run"
                    ].concat(productExtraOptions),
                    { shell: true, env: { "RSYNC_RSH": "ssh -o ConnectTimeout=30 -o ServerAliveInterval=30 -o ServerAliveCountMax=30" } }
                )
                    .then((value) => {
                        if (DEBUG)
                            console.log("rsync '" + product + "': success " + value.stdout);

                        let result = _formatRsyncOutput(product, value.stdout);
                        if (DEBUG)
                            console.log("rsync '" + product + "': success " + result);
                        changes = changes.concat(result);
                        count = RSYNC_RETRIES;

                        resolve();
                    })
                    .catch((err) => {
                        /* 23 indica transferência incompleta, vamos analisar porque queremos ignorar:
                          * remover directorias que não conhece (i.e. security)
                          * mudar ctime dos ficheiros (que sejam de outro owner)
                          */
                        if (err.exitCode == 23) {
                            const relevantErrors = err.stderr
                              .split("\n")
                              .filter(line => !/^rsync: failed to set times on/.test(line))
                              .filter(line => !/^rsync error: some files/.test(line)) // linha final sempre que há erros
                              .filter(line => !/disabling multiplexing/.test(line)) // output irrelevante do ssh
                           ;
                            if(relevantErrors.length == 0){
                               count = RSYNC_RETRIES;
                               resolve();
                            } else {
                               count = RSYNC_RETRIES;
                               reject(new Error(relevantErrors));
                            }
                        } else if (count > RSYNC_RETRIES) {
                            reject(new Error(err));;
                        } else {
                            if (DEBUG)
                                console.log("rsync '" + product + "': attempt " + (count + 1) + " failed with code " + err.exitCode);
                        }
                    });
                count++;
            }
        });
    });
    await Promise.all(requests).catch(err => { throw new Error(err.message); });
    return changes;
}

/* ************************************ */
function _formatRsyncOutput(product, rsyncOutput) {
    return rsyncOutput
        .split("\n")
        .slice(1, -3) // O Header e o Footer não interessam
        .filter(line => /^[*<>]/.test(line)) // Só interessam linhas de mudança (ie, * ou > ou < )
        .map(line => {
            let linePart = line.split(" ");
            if (linePart[0] == "*deleting")
                return "delete".brightRed + " " + product + "/" + linePart[1];
            if (linePart[0].startsWith("<fc"))
                return "change".brightYellow + " " + product + "/" + linePart[1];
            if (linePart[0].startsWith(">fc"))
                return "changed".brightYellow + " " + product + "/" + linePart[1];
            if (linePart[0].startsWith("<f+"))
                return "create".brightGreen + " " + product + "/" + linePart[1];
            if (linePart[0].startsWith(">f+"))
                return "created".brightGreen + " " + product + "/" + linePart[1];
        });
}

/* ************************************ */
async function confirmExecutionOfChanges(cmdEnv, extraOptions = []) {
    console.log("\nChecking changes... ")
    let changes = (await _syncFiles(_syncFiles.DIFF, cmdEnv,  "localCopy", "serverLive", extraOptions)).filter( f => !f.endsWith("/") )
    if (changes.length) {
        console.log("\nChanges that will be done in " + cmdEnv.serverStr + ":");
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
exports.confirmExecutionOfChanges = confirmExecutionOfChanges;

/* ************************************ */
function resolveCobPath(server, type, product) {
    switch (type) {
        case "localCopy":
            return "./" + product + "/";

        case "serverInitial":
            return server + ":/opt/" + product + "/etc.default/";

        case "serverLive":
            switch (product) {
                case "recordm-importer":
                case "others":
                    return server + ':' + "/opt/" + product + "/";
                default:
                    return server + ':' + "/etc/" + product + "/";
            }
    }
}
exports.resolveCobPath = resolveCobPath;
