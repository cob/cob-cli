require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { copyFiles } = require("../task_lists/common_syncFiles");
const { promptCredentials, readYamlFile } = require("../task_lists/common_helpers.js");
const { validateUpdateFromServerConditions } = require("../task_lists/updateFromServer_validate");
const { getGroupsFromServer } = require("../task_lists/updateFromServer_groups");
const { getDefinitionsFromServer } = require("../task_lists/updateFromServer_definitions");
const { getInstancesFromServer } = require("../task_lists/updateFromServer_instances");
const { getKibanaFromServer } = require("../task_lists/updateFromServer_kibana");
const { getDomainsFromServer } = require("../task_lists/updateFromServer_domains");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const axios = require('axios');
const tough = require('tough-cookie');
const fs = require("fs/promises");
const axiosCookieJarSupport = require('axios-cookiejar-support')
const path = require('path')
const FileCookieStore = require('file-cookie-store');

async function updateFromServer(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        if (args.code) {

            await validateUpdateFromServerConditions(cmdEnv).run()

            console.log("\nOk to proceed. Getting files from server's live directories...");
            await cmdEnv.applyCurrentCommandEnvironmentChanges()
            let changes = await copyFiles(cmdEnv, "serverLive", "localCopy", args)
            await cmdEnv.unApplyCurrentCommandEnvironmentChanges()

            if (changes.length == 0) {
                console.log("\nFinished.".green, "Nothing todo, no changes detected.");
            } else {
                console.log("\n " + changes.join("\n "));
                console.log("\nUpdate done!".yellow, "Check", "git status".bold.blue, "and", "git diff".bold.blue, "to see the resulting differences.");
                console.log("Notice that", "any changes since last deploy migth be lost.".underline)
                console.log("Notice also that you will need to do a", "cob-cli deploy --force".bold.blue, "on next deploy.")
            }
        } else {

            axiosCookieJarSupport.wrapper(axios)
            axios.defaults.ignoreCookieErrors = true
            axios.defaults.withCredentials = true
            const cookieJar = new tough.CookieJar()
            axios.defaults.jar = cookieJar

            if( args.cookie ) {
                const p = path.resolve(args.cookie);
                const cookieFile = new FileCookieStore(p, {auto_sync: false, force_parse: true});
                try{
                    let c = await new Promise((resolve, reject) => {
                        cookieFile.findCookie(`${cmdEnv.servername}.cultofbits.com`, '/', 'cobtoken', (err, result) => {
                            if(err != null) reject(err);
                            else resolve(result)
                        })
                    });
                    if(!c){
                        throw Error( `couldn't find a cookie for ${cmdEnv.servername} in ${p}`)
                    }
                    cookieJar.setCookie(c.toString(), `https://${cmdEnv.servername}.cultofbits.com`)
                } catch(e){
                    console.error(e)
                    return
                }

            } else {
                const credentials = await promptCredentials()
                await axios.post(`https://${cmdEnv.servername}.cultofbits.com/recordm/security/auth`, credentials, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            }

            console.log("\n Removing existing Data")
            const dataFiles = await fs.readdir("others/customizationData");
            for (const file of dataFiles) {
                const filePath = path.join("others/customizationData", file);
                await fs.rm(filePath, {recursive: true, force: true} )
            }

            const solutions = await readYamlFile("solutions.yml")

            for (const solution of solutions) {

                console.log("\nStarting updateFromServer of solution " + solution.name)

                const dataPath = `others/customizationData/${solution.name}`
                fs.mkdir(dataPath, { recursive: true })

                if (solution.permissions) {
                    await getGroupsFromServer(
                        cmdEnv.servername,
                        solution.groups,
                        dataPath + "/permissions.json",
                        solution.name,
                        args
                    )
                }

                if (solution.definitions) {
                    const definitionPath = dataPath + '/definitions/'
                    fs.mkdir(definitionPath, { recursive: true })
                    const viewsPath = dataPath + '/views/'
                    fs.mkdir(viewsPath, { recursive: true })
                    await getDefinitionsFromServer(
                        cmdEnv.servername,
                        solution.definitions,
                        definitionPath,
                        viewsPath,
                        solution.name,
                        args
                    ).run()
                }

                if (solution.instances) {
                    const instancesPath = dataPath + '/instances/'
                    fs.mkdir(instancesPath, { recursive: true })
                    await getInstancesFromServer(
                        cmdEnv.servername,
                        solution.instances,
                        instancesPath,
                        solution.name,
                        args
                    )
                }

                if(solution.kibana){
                    const kibanaPath = dataPath + '/kibana/'
                    fs.mkdir(kibanaPath, { recursive: true })
                    await getKibanaFromServer(
                        cmdEnv.servername,
                        solution.kibana.spaces,
                        kibanaPath,
                        solution.name,
                        args
                    )
                }

                if(solution.domains){
                    const domainsPath = dataPath + '/domains/'
                    fs.mkdir(domainsPath, { recursive: true })
                    await getDomainsFromServer(
                        cmdEnv.servername,
                        solution.domains.filter,
                        domainsPath,
                        solution.name,
                        args
                    )
                }

            }

            await fs.writeFile('others/customizationData/_index', solutions.map(c => c.name).join('\n'), 'utf-8')
        }


    } catch (err) {
        console.error("\n", err.message);
    }
}


module.exports = updateFromServer;
