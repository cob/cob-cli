require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const path = require('path');
const spawn = require('child_process').spawn;

async function getDefs(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        console.log(`Getting definitions from ${cmdEnv.serverStr} to branch ${cmdEnv.branchStr} ...` );
        const getDefs = spawn(path.resolve(__dirname,"..","task_lists","getDefs.sh"),[cmdEnv.server, cmdEnv.name, path.resolve(__dirname) ]) 
        getDefs.stdout.on('data', function (data) { console.log("  " + data.toString()); });
        getDefs.on('exit', function () { console.log('Done!'); });
    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = getDefs;