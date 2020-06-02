require('colors');
const { getServerName, getServer, copyFiles } = require("../task_lists/helpers");

async function reset(args) {
    try {
        const servername = getServerName()
        const server = getServer(servername)

        console.log("Getting files from server's live directories:", server.bold.blue,"...");

        let changes = await copyFiles(server, "productionLive", "localMaster") 

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
module.exports = reset;


/* ************************************ */
// Tests:
// cob-cli reset (changes on live)            -> should get all files and warn of changes. Any conflicting files are overwriten with server files
// cob-cli reset (no change anywhere)         -> should say 'nothing todo'
// cob-cli reset (changes on server checkout) -> should ignore (only detected on deploy)