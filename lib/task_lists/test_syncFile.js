const execa = require('execa');
const fs = require('fs-extra');
const { resolveCobPath: resolveCobPath } = require("./common_syncFiles");

const DEBUG = false;
const RSYNC_RETRIES = 10;

/* ************************************ */

async function syncFile(server, file) {
    let product = file.split("/")[0];
    let filePath = file.substring(file.indexOf("/") + 1); // remove o directorio inicial do producto
    let remoteProductPath = resolveCobPath(server, "serverLive", product);
    let fileDir;
    let localFileDir;

    if (DEBUG) console.log("Start rsync " + filePath);
    await execa('ssh', [server, "mkdir -p " + fileDir]);

    let count = 0;
    while (count < RSYNC_RETRIES) {
        await execa('rsync', [file, remoteProductPath + filePath, "-acz", "--prune-empty-dirs"])
            .then(count = RSYNC_RETRIES)
            .catch(async (err) => {
                // exitCode 23 indicam que o ficheiro não existe na origem. Temod de apagar no destino.
                if (err.exitCode == 23) {
                    await execa('ssh', [server, "rm -fd " + remoteProductPath.split(":")[1] + filePath]).catch({});
                    if (!fs.existsSync(localFileDir)) {
                        if (DEBUG) console.log(localFileDir + " needs to be removed");
                        await execa('ssh', [server, "rmdir " + fileDir]).catch({});
                    }
                    count = RSYNC_RETRIES;
                } else if (count > RSYNC_RETRIES) {
                    if (DEBUG) console.log("rsync '" + filePath + "': failed with " + err.exitCode + " -> " + err.message);
                    throw err;
                } else {
                    if (DEBUG) console.log("rsync '" + filePath + "': attempt " + (count + 1) + " failed with code " + err.exitCode);
                }
            });
        count++;
    }
}
exports.syncFile = syncFile;