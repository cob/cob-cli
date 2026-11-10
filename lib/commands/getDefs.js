require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { authenticate } = require("../task_lists/common_auth");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

async function getDefs(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        console.log(`Getting definitions from ${cmdEnv.serverStr} to branch ${cmdEnv.branchStr} ...` );
        await authenticate(cmdEnv, args)

        const uri = `https://${cmdEnv.serverHTTPs}/recordm/recordm/definitions`
        const defsList = (await axios.get(uri)).data

        // Get everything before touching the local files, so a failure doesn't leave us with half the definitions
        const definitions = []
        for (const def of defsList) {
            if (/[\/\\]/.test(def.name)) throw new Error(`Can't save Definition "${def.name}", its name has a path separator.`)
            console.log("  getting def: " + def.name)
            const response = await axios.get(`${uri}/${def.id}`)
            definitions.push({ name: def.name, json: stringify(response.data) })
        }

        const dir = path.join("recordm", "definitions", cmdEnv.name)
        await fs.mkdir(dir, { recursive: true })
        for (const file of await fs.readdir(dir)) {
            if (file.endsWith(".json")) await fs.rm(path.join(dir, file))
        }
        for (const def of definitions) {
            await fs.writeFile(path.join(dir, `${def.name}.json`), def.json)
        }

        console.log("\nDone!".green, `${definitions.length} definitions saved on ${dir}`)
    } catch(err) {
        console.error("\n",err.message);
        process.exitCode = 1;
    }
}
module.exports = getDefs;

/* ************************************ */
// Stable output, to minimize noise on git diffs: keys sorted and without the "defaultValue" attributes
function stringify(definition) {
    return JSON.stringify(normalize(definition), null, 2) + "\n"
}

function normalize(value) {
    if (Array.isArray(value)) return value.map(normalize)
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.keys(value).sort()
                .filter(key => key !== "defaultValue")
                .map(key => [key, normalize(value[key])])
        )
    }
    return value
}
