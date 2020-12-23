const execa = require('execa');
const fs = require('fs-extra');
const { resolveCobPath } = require("./common_syncFiles");

const DEBUG = false;
const RSYNC_RETRIES = 10;

/* ************************************ */

async function syncFile(server, localFile) {
    if (DEBUG) console.log("Start rsync " + localFile);
        
    let product = localFile.split("/")[0];
    let productScopeFilePath = localFile.substring(localFile.indexOf("/") + 1); // remove o directorio inicial do producto
    let remoteProductPath = resolveCobPath(server, "serverLive", product);
    let remoteFileDir = remoteProductPath.split(":")[1] + productScopeFilePath.substring(0, productScopeFilePath.lastIndexOf("/"));
        
    let count = 0;
    while (count < RSYNC_RETRIES) {
        await execa('ssh', [server, "mkdir -p " + remoteFileDir]).catch({});
        await execa('rsync', [localFile, remoteProductPath + productScopeFilePath, "-acz", "--prune-empty-dirs"])
            .then(count = RSYNC_RETRIES)
            .catch(async (err) => {
                // exitCode 23 indicam que o ficheiro não existe na origem. Temod de apagar no destino.
                if (err.exitCode == 23) {
                    await execa('ssh', [server, "rm -fd " + remoteProductPath.split(":")[1] + productScopeFilePath]).catch({});

                    let localFileDir = localFile.substring(0, localFile.lastIndexOf("/"));
                    if (!fs.existsSync(localFileDir)) {
                        if (DEBUG) console.log(remoteFileDir + " needs to be removed");
                        await execa('ssh', [server, "rmdir " + remoteFileDir]).catch({});
                    }
                    count = RSYNC_RETRIES;
                } else if (count > RSYNC_RETRIES) {
                    if (DEBUG) console.log("rsync '" + productScopeFilePath + "': failed with " + err.exitCode + " -> " + err.message);
                    throw err;
                } else {
                    if (DEBUG) console.log("rsync '" + productScopeFilePath + "': attempt " + (count + 1) + " failed with code " + err.exitCode);
                }
            });
        count++;
    }
}
exports.syncFile = syncFile;