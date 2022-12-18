require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { copyFiles } = require("../task_lists/common_syncFiles");
const { validateUpdateFromServerConditions } = require("../task_lists/updateFromServer_validate");
const { checkRepoVersion } = require("../commands/upgradeRepo");

async function updateFromServer(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        await validateUpdateFromServerConditions(cmdEnv).run()

        console.log("\nOk to proceed. Getting files from server's live directories...");
        await cmdEnv.applyCurrentCommandEnvironmentChanges()
        let changes = await copyFiles(cmdEnv, "serverLive", "localCopy") 
        await cmdEnv.unApplyCurrentCommandEnvironmentChanges()

        if(changes.length == 0) {
            console.log("\nFinished.".green,"Nothing todo, no changes detected.");
        } else {
            console.log("\n " + changes.join("\n "));
            console.log("\nUpdate done!".yellow,"Check","git status".bold.blue,"and","git diff".bold.blue,"to see the resulting differences.");
            console.log("Notice that","any changes since last deploy migth be lost.".underline)
            console.log("Notice also that you will need to do a","cob-cli deploy --force".bold.blue,"on next deploy.")
        }
    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = updateFromServer;