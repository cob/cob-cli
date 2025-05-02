require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { copyFiles } = require("../task_lists/common_syncFiles");
const { validateUpdateFromServerConditions } = require("../task_lists/updateFromServer_validate");
const { getGroupsFromServer } = require("../task_lists/updateFromServer_groups");
const { getDefinitionsFromServer } = require("../task_lists/updateFromServer_definitions");
const { getInstancesFromServer } = require("../task_lists/updateFromServer_instances");
const { getKibanaFromServer } = require("../task_lists/updateFromServer_kibana");
const { get, getDomainsFromServer } = require("../task_lists/updateFromServer_domains");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const inquirer = require("inquirer")
const axios = require('axios');
const tough = require('tough-cookie');
const fs = require("fs/promises");
const yaml = require('js-yaml');
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

                const credentials = await getCredentials()

                await axios.post(`https://${cmdEnv.servername}.cultofbits.com/recordm/security/auth`, credentials, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            }

            const customizations = await readConfig()

            for (const customization of customizations) {

                console.log("\nStarting updateFromServer of customization " + customization.name)

                const dataPath = 'others/customizationData/' + customization.name
                fs.mkdir(dataPath, { recursive: true })


                if (customization.permissions) {
                    await getGroupsFromServer(
                        cmdEnv.servername,
                        customization.groups,
                        dataPath + "/permissions.json",
                        customization.name,
                        args
                    )
                }

                if (customization.definitions) {
                    const definitionPath = dataPath + '/definitions/'
                    fs.mkdir(definitionPath, { recursive: true })
                    const viewsPath = dataPath + '/views/'
                    fs.mkdir(viewsPath, { recursive: true })
                    await getDefinitionsFromServer(
                        cmdEnv.servername,
                        customization.definitions,
                        definitionPath,
                        viewsPath,
                        customization.name,
                        args
                    )
                }

                if (customization.instances) {
                    const instancesPath = dataPath + '/instances/'
                    fs.mkdir(instancesPath, { recursive: true })
                    await getInstancesFromServer(
                        cmdEnv.servername,
                        customization.instances,
                        instancesPath,
                        customization.name,
                        args
                    )
                }

                if(customization.kibana){
                    const kibanaPath = dataPath + '/kibana/'
                    fs.mkdir(kibanaPath, { recursive: true })
                    await getKibanaFromServer(
                        cmdEnv.servername,
                        customization.kibana.spaces,
                        kibanaPath,
                        customization.name,
                        args
                    )
                }

                if(customization.domains){
                    const domainsPath = dataPath + '/domains/'
                    fs.mkdir(domainsPath, { recursive: true })
                    await getDomainsFromServer(
                        cmdEnv.servername,
                        customization.domains.filter,
                        domainsPath,
                        customization.name,
                        args
                    )
                }

            }
        }


    } catch (err) {
        console.error("\n", err.message);
    }
}

async function readConfig() {
    try {
        const data = await fs.readFile("customizationsDef.yml", 'utf-8');
        const config = yaml.load(data);
        return config
    } catch (error) {
        console.error('Error reading YAML file:', error.message);
    }
}


const getCredentials = async () => {

    const answers = await inquirer
        .prompt([
            {
                type: 'text',
                message: 'Enter username:',
                name: 'username',
            },
            {
                type: 'password',
                message: 'Enter password:',
                name: 'password',
                mask: '*',
            },
        ])

    return answers
};



module.exports = updateFromServer;
