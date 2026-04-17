require('colors');
const { checkRepoVersion } = require("../commands/upgradeRepo");
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { executeTasks } = require("../task_lists/package_execute");

async function package(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)
        if(args.resync) args.force = true;

        await executeTasks(cmdEnv, args).run();

        console.log("\nDone!".green, "\nEnjoy!")

    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = package;
