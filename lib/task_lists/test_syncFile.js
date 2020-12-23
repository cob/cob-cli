const execa = require('execa');
const fs = require('fs-extra');
const { resolveCobPath: resolveCobPath } = require("./common_syncFiles");

const DEBUG = false;
const RSYNC_RETRIES = 10;

/* ************************************ */

async function syncFile(server, localFile) {
    if (DEBUG) console.log("Start rsync " + productFilePath);
        
    let product = localFile.split("/")[0];
    let productFilePath = localFile.substring(localFile.indexOf("/") + 1); // remove o directorio inicial do producto
    let remoteProductPath = resolveCobPath(server, "serverLive", product);
    let remoteFileDir = remoteProductPath.split(":")[1] + productFilePath.substring(0, productFilePath.lastIndexOf("/"));
        
    let count = 0;
    while (count < RSYNC_RETRIES) {
        await execa('ssh', [server, "mkdir -p " + remoteFileDir]).catch({});
        await execa('rsync', [localFile, remoteProductPath + productFilePath, "-acz", "--prune-empty-dirs"])
            .then(count = RSYNC_RETRIES)
            .catch(async (err) => {
                // exitCode 23 indicam que o ficheiro não existe na origem. Temod de apagar no destino.
                if (err.exitCode == 23) {
                    await execa('ssh', [server, "rm -fd " + remoteProductPath.split(":")[1] + productFilePath]).catch({});
                    count = RSYNC_RETRIES;
                } else if (count > RSYNC_RETRIES) {
                    if (DEBUG) console.log("rsync '" + productFilePath + "': failed with " + err.exitCode + " -> " + err.message);
                    throw err;
                } else {
                    if (DEBUG) console.log("rsync '" + productFilePath + "': attempt " + (count + 1) + " failed with code " + err.exitCode);
                }
            });
        count++;
    }
}
exports.syncFile = syncFile;