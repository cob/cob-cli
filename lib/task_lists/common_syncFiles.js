const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
const { getKeypress, getServerName, getServer } = require("../task_lists/common_helpers");

/* ************************************ */
const COB_PRODUCTS = ["recordm", "integrationm", "recordm-importer", "userm", "confm", "others"];
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
    "--exclude=*.swap",
    "--exclude=*.swp",
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
async function testEquality(server, from, to) {
    return (await _syncFiles(_syncFiles.TEST, server, from, to)).filter( f => !f.endsWith("/"))
}
exports.testEquality = testEquality;

/* ************************************ */
async function _syncFiles(executionType, server, from, to, extraOptions = []) {
    let changes = [];
    let requests = COB_PRODUCTS.map(product => {
        return new Promise(async (resolve, reject) => {
            let fromPath = resolveCobPath(server, from, product);
            let toPath = resolveCobPath(server, to, product);
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
                        executionType == _syncFiles.COPY ? "-v" : "--dry-run"
                    ].concat(_syncFiles.excludeOptions, productExtraOptions),
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
async function confirmExecutionOfChanges(server, extraOptions = []) {
    console.log("\nChecking changes... ")
    let changes = (await _syncFiles(_syncFiles.DIFF, server,  "localCopy", "serverLive", extraOptions)).filter( f => !f.endsWith("/") )
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
function resolveCobPath(server, type, product) {
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
}exports.resolveCobPath = resolveCobPath;