require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { promptCredentials, readYamlFile } = require("../task_lists/common_helpers.js");
const { tagDefinitions } = require("../task_lists/tagDefs_execute.js");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const axios = require('axios');
const tough = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support')
const path = require('path')
const FileCookieStore = require('file-cookie-store');

async function tagDefs(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

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

        const customizations = await readYamlFile("customizationsDef.yml")

        for (const customization of customizations) {
            console.log("\nStarting to tag Defs of customization " + customization.name, customization.definitions)
            if (customization.definitions) {
                await tagDefinitions(cmdEnv.servername, customization.name, customization.definitions, args)
            }
        }

    } catch (err) {
        console.error("\n", err.message);
    }
}

module.exports = tagDefs;
