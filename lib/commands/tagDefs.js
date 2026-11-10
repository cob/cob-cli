require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { readYamlFile } = require("../task_lists/common_helpers.js");
const { authenticate } = require("../task_lists/common_auth");
const { tagDefinitions } = require("../task_lists/tagDefs_execute.js");
const { checkRepoVersion } = require("../commands/upgradeRepo");

async function tagDefs(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        await authenticate(cmdEnv, args)

        const solutions = await readYamlFile("solutions.yml")

        for (const solution of solutions) {
            console.log("\nStarting to tag Defs of solution " + solution.name, solution.definitions)
            if (solution.definitions) {
                await tagDefinitions(cmdEnv.servername, solution.name, solution.definitions, args)
            }
        }

    } catch (err) {
        console.error("\n", err.message);
    }
}

module.exports = tagDefs;
