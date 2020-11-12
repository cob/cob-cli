const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const { getKeypress, getServerName, getServer } = require("../task_lists/common_helpers");

/* ************************************ */

async function syncFile(server, file) {
    let product = file.split("/")[0];
    let filePath = file.substring(file.indexOf("/") + 1);
    let remoteProductPath = _resolveCobPath(server, "serverLive", product);
    let fileDir = remoteProductPath.split(":")[1] + filePath.substring(0, filePath.lastIndexOf("/"));
    let localFileDir = product + "/" + filePath.substring(0, filePath.lastIndexOf("/"));

    if (DEBUG)
        console.log("Start rsync " + filePath);
    await execa('ssh', [server, "mkdir -p " + fileDir]);

    let count = 0;
    while (count < RSYNC_RETRIES) {
        await execa('rsync', [file, remoteProductPath + filePath, "-acz"])
            .then(count = RSYNC_RETRIES)
            .catch(async (err) => {
                // exitCode 23 indicam que o ficheiro não existe na origem. Temod de apagar no destino.
                if (err.exitCode == 23) {
                    await execa('ssh', [server, "rm -f " + remoteProductPath.split(":")[1] + filePath]).catch({});
                    if (!fs.existsSync(localFileDir)) {
                        if (DEBUG)
                            console.log(localFileDir + " needs to be removed");
                        await execa('ssh', [server, "rmdir " + fileDir]).catch({});
                    }

                    count = RSYNC_RETRIES;
                } else if (count > RSYNC_RETRIES) {
                    if (DEBUG)
                        console.log("rsync '" + filePath + "': failed with " + err.exitCode + " -> " + err.message);
                    throw err;
                } else {
                    if (DEBUG)
                        console.log("rsync '" + filePath + "': attempt " + (count + 1) + " failed with code " + err.exitCode);
                }
            });
        count++;
    }
}
exports.syncFile = syncFile;

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
exports.confirmExecutionOfChanges = confirmExecutionOfChanges;

/* ************************************ */
const COB_PRODUCTS = ["recordm", "integrationm", "recordm-importer", "userm", "confm", "others"];
const RSYNC_RETRIES = 10;
const DEBUG = false;
_syncFiles.TEST = "Test equality";
_syncFiles.DIFF = "Get differences";
_syncFiles.COPY = "Copy";
_syncFiles.excludeOptions = [
    "--exclude=health.conf",
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
function copyFiles(server, from, to) {
    return _syncFiles(_syncFiles.COPY, server, from, to);
}
exports.copyFiles = copyFiles;

/* ************************************ */
function testEquality(server, from, to) {
    return _syncFiles(_syncFiles.TEST, server, from, to);
}
exports.testEquality = testEquality;

/* ************************************ */
async function _syncFiles(executionType, server, from, to, extraOptions = []) {
    let changes = [];
    let requests = COB_PRODUCTS.map(product => {
        return new Promise(async (resolve, reject) => {
            let fromPath = _resolveCobPath(server, from, product);
            let toPath = _resolveCobPath(server, to, product);

            if (from != "serverLive" && executionType == _syncFiles.COPY && !fs.existsSync(product)) {
                resolve();
                return;
            }

            let count = 0;
            while (count < RSYNC_RETRIES) {
                if (DEBUG)
                    console.log("rsync '" + product + "': attempt " + (count + 1));
                await execa('rsync',
                    [
                        fromPath,
                        toPath,
                        "-acvi",
                        "--delete",
                        executionType == _syncFiles.COPY ? "-v" : "--dry-run"
                    ].concat(_syncFiles.excludeOptions, extraOptions),
                    { shell: true, env: { "RSYNC_RSH": "ssh -v -o ConnectTimeout=30 -o ServerAliveInterval=30 -o ServerAliveCountMax=30" } }
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
                        /* 23 é a indicar que directorias não existem, ie, não é um problema por isso não devolve erro */
                        if (err.exitCode == 23) {
                            count = RSYNC_RETRIES;
                            resolve();
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

    if (executionType == _syncFiles.TEST && changes.length != 0) {
        let errors = [
            ("There are diferences between " + from + " and " + to + ".").red,
            " In " + from + " someone...",
            "  " + changes.join("\n  "),
            "",
            " ServerLive needs to be equal to lastDeploy. Either fix the problem manually or:",
            "  1) clean up local repo (only if necessary and probably using " + "git stash --include-untracked".yellow + ")",
            "  2) run " + "cob-cli updateFromServer [--servername <servername>]".yellow,
            "  3) check and fix the changes",
            "  4) commit the result",
            "  5) run " + "cob-cli deploy --force [--servername <servername>]".yellow,
            "  6) restore your previous changes (if you followed step 1 then use " + "git stash pop".yellow + ")",
            "",
            "Error:".bgRed + " Latest version deployed differs from current serverLive"
        ];
        throw new Error(errors.join("\n"));
    }
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
                    return server + ':' + "/opt/" + product + "/";
                default:
                    return server + ':' + "/etc/" + product + "/";
            }
    }
}
