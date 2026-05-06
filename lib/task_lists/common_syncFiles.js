const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const { getKeypress } = require("../task_lists/common_helpers");
const { getRsyncSsh, getServerAddress, getSshArgs } = require("./common_helpers");

/* ************************************ */
const COB_PRODUCTS = ["recordm", "integrationm", "recordm-importer", "reportm", "userm", "confm", "others", "authm"];

_syncFiles.TEST = "Test equality";
_syncFiles.DIFF = "Get differences";
_syncFiles.COPY = "Copy";

/* ************************************ */
function copyFiles(cmdEnv, from, to, args) {
    return _syncFiles(_syncFiles.COPY, cmdEnv, from, to, [], args);
}
exports.copyFiles = copyFiles;

/* ************************************ */
async function testEquality(cmdEnv, from, to, args) {
    return (await _syncFiles(_syncFiles.TEST, cmdEnv, from, to, [], args)).changes.filter( f => !f.endsWith("/"))
}
exports.testEquality = testEquality;

/* ************************************ */
async function _syncFiles(executionType, cmdEnv, from, to, extraOptions = [], args = []) {
    let changes = [];
    let encFiles = [];
    let products = cmdEnv.products.length ? cmdEnv.products : COB_PRODUCTS;
    // we need to recheck, because it can exist in head but not in the commit we're testing
    let hasRsyncFilter = cmdEnv.rsyncFilter && fs.lstatSync(cmdEnv.rsyncFilter, {throwIfNoEntry: false})?.isFile();
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
                if (args.verbose > 2)
                    console.log("rsync".bold +" '" + (product).blue + "': attempt " + (count + 1));
                const protectFilters = _getDecryptedEncFilePaths(product).map(p => `--filter='P ${p}'`);
                const rsyncArgs = [
                    fromPath,
                    toPath,
                    "-acvi",
                    "--delete",
                    "--chmod=g+w",
                    "--no-perms",
                    "--no-group",
                    "--no-t",
                    "--filter='merge " + path.resolve(__dirname,"rsyncFilter-pre.txt") + "'",
                    hasRsyncFilter ? "--filter='merge " + cmdEnv.rsyncFilter + "'" : "",
                    "--filter='merge " + path.resolve(__dirname,"rsyncFilter-post.txt") + "'",
                    ...protectFilters,
                    executionType == _syncFiles.COPY ? "-v" : "--dry-run"
                ].concat(productExtraOptions)
                if (args.verbose > 3) {
                    console.log('rsync', rsyncArgs.join(' '))
                }
                await execa('rsync', rsyncArgs, {
                    shell: true,
                    env: { "RSYNC_RSH": getRsyncSsh() }
                })
                    .then((value) => {
                        if (args.verbose > 3)
                            console.log("rsync".bold +" '" + (product).blue + "': " + "success".green + " " + value.stdout);

                        let rsyncOutput = value.stdout;
                        if (executionType == _syncFiles.TEST || executionType == _syncFiles.DIFF)
                            rsyncOutput = _filterDecryptedEncFiles(product, rsyncOutput);
                        let result = _formatRsyncOutput(product, rsyncOutput);
                        if (args.verbose > 2)
                            console.log("rsync '" + product + "': success " + result);
                        else if (args.verbose > 1)
                            console.log("rsync '" + product + "': success ");
                        changes = changes.concat(result);
                        if (executionType == _syncFiles.COPY)
                            encFiles = encFiles.concat(_extractEncFilePaths(product, value.stdout));
                        count = RSYNC_RETRIES;

                        resolve();
                    })
                    .catch((err) => {
                        /* 23 indica transferência incompleta, vamos analisar porque queremos ignorar:
                          * remover directorias que não conhece (i.e. security)
                          * mudar ctime dos ficheiros (que sejam de outro owner)
                          */
                        if (err.exitCode == 23) {
                            if(args.verbose > 1){
                               console.log("warning".yellow + " :" + (product).blue + ": got some output on stderr: ")
                               err.stderr.split("\n").forEach((err) => console.log("warning".yellow + " :" + (product).blue + ": " + err) )
                            }
                            const relevantErrors = err.stderr
                              .split("\n")
                              .filter(line => !/^rsync: failed to set times on/.test(line))
                              .filter(line => !/^rsync error: some files/.test(line)) // linha final sempre que há erros
                              .filter(line => !/disabling multiplexing/.test(line)) // output irrelevante do ssh
                              .filter(line => !/No such file or directory/.test(line)) // quando dir base remoto não existe
                              .filter(line => !/write error: Broken pipe/.test(line) && !fs.existsSync(to)) // quando não existe localmente dir base
                           ;
                            if(relevantErrors.length == 0){
                               if (args.verbose > 1)
                                  console.log("rsync '" + product + "': success ");
                               count = RSYNC_RETRIES;
                               resolve();
                            } else {
                               count = RSYNC_RETRIES;
                               reject(new Error(relevantErrors));
                            }
                        } else if (( count + 1 ) >= RSYNC_RETRIES) {
                            reject(new Error(err));;
                        } else {
                            if (args.verbose > 1)
                                console.log("warning".yellow + " rsync '" + (product).blue + "': attempt " + (count + 1) + " of " + RSYNC_RETRIES + " failed with code " + err.exitCode);
                        }
                    });
                count++;
            }
        });
    });
    await Promise.all(requests).catch(err => { throw new Error(err.message); });
    return { changes, encFiles };
}

/* ************************************ */
function _filterDecryptedEncFiles(product, rsyncOutput) {
    return rsyncOutput
        .split("\n")
        .filter(line => {
            // ignore decrypted files:
            // * marked as deleted on local -> server
            // * marked as added on server -> local
            if (line.startsWith("*deleting ") || /^>f\+/.test(line)) {
                const relativePath = line.split(/\s+/)[1];
                if (!relativePath) return true;
                return !fs.existsSync("./" + product + "/" + relativePath + ".enc");
            }
            return true;
        })
        .join("\n");
}

/* ************************************ */
function _getDecryptedEncFilePaths(product) {
    const productDir = "./" + product;
    if (!fs.existsSync(productDir)) return [];
    const paths = [];
    const walk = (dir, rel) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const entryRel = rel ? rel + "/" + entry.name : entry.name;
            if (entry.isDirectory()) walk(path.join(dir, entry.name), entryRel);
            else if (entry.name.endsWith(".enc")) paths.push("/" + entryRel.slice(0, -4));
        }
    };
    walk(productDir, "");
    return paths;
}

/* ************************************ */
function _formatRsyncOutput(product, rsyncOutput) {
    return rsyncOutput
        .split("\n")
        .slice(1, -3) // O Header e o Footer não interessam
        .filter(line => /^[*<>]/.test(line)) // Só interessam linhas de mudança (ie, * ou > ou < )
        .map(line => {
            let linePart = line.split(/\s+/);
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
    let changes = (await _syncFiles(_syncFiles.DIFF, cmdEnv,  "localCopy", "serverLive", extraOptions)).changes.filter( f => !f.endsWith("/") )
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
function _getServerLiveBasePath(product) {
    switch (product) {
        case "recordm-importer":
        case "others":
            return "/opt/" + product + "/";
        default:
            return "/etc/" + product + "/";
    }
}

/* ************************************ */
function resolveCobPath(server, type, product) {
    switch (type) {
        case "localCopy":
            return "./" + product + "/";

        case "serverInitial":
            return getServerAddress(server) + ":/opt/" + product + "/etc.default/";

        case "serverLive":
            return getServerAddress(server) + ':' + _getServerLiveBasePath(product);

        case "staging":
            return ".staging/" + product + "/";
    }
}
exports.resolveCobPath = resolveCobPath;

/* ************************************ */
function _extractEncFilePaths(product, rsyncOutput) {
    const basePath = _getServerLiveBasePath(product);
    return rsyncOutput
        .split("\n")
        .slice(1, -3)
        .filter(line => /^[<>]f/.test(line))
        .map(line => line.split(/\s+/)[1])
        .filter(filePath => filePath && filePath.endsWith(".enc"))
        .map(filePath => basePath + filePath);
}

/* ************************************ */
async function decryptEncFile(server, serverFilePath) {
    await execa('ssh', [...getSshArgs(server), `sudo -u cob-secrets /usr/local/bin/cob-decrypt '${serverFilePath}'`]);
}
exports.decryptEncFile = decryptEncFile;

/* ************************************ */
async function decryptEncFiles(cmdEnv, encFiles) {
    for (const f of encFiles) {
        await decryptEncFile(cmdEnv.server, f);
    }
}
exports.decryptEncFiles = decryptEncFiles;

/* ************************************ */
async function deploySolutions(server) {
    const result = await execa('ssh', [...getSshArgs(server),
        '/usr/local/bin/cc-install solutions'
    ], { reject: false, all: true });

    return { output: result.all, exitCode: result.exitCode };
}
exports.deploySolutions = deploySolutions;

