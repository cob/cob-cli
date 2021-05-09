require('colors');
const { getCurrentBranch } = require("./common_releaseManager");

/* ************************************ */
async function getEnviroment(args) {
    const servername = args.servername ? args.servername : getServerName("prod")
    const server = getServer(servername)

    let defaultserver = getServer(getServerName());
    let serverStr = server == defaultserver ? server.bold.blue : server.bold.bgRed + " (default is " + defaultserver.bold.blue + ")";

    let currentBranch = await getCurrentBranch();
    let branchStr = currentBranch == "master" ? "master".bold.blue : currentBranch.bgRed ;

    return {
        server: server,
        serverName: servername,
        serverStr: serverStr,
        branchStr: branchStr
    }
}
exports.getEnviroment = getEnviroment;

/* ************************************ */
function getServerName() {
    const fs = require('fs-extra');
    try {
        var data = fs.readFileSync('.server', 'utf8');
        return data;
    } catch {
        throw new Error("\nError:".red + " file " + ".server".blue.bold + " not found. This command should be run inside project directory.\n");
    }
}

/* ************************************ */
function getServer(serverName) {
    return serverName + ".cultofbits.com";
}
exports.getServer = getServer;

