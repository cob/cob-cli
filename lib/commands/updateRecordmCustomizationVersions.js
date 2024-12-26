require('colors');
const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { validateUpdateFromServerConditions } = require("../task_lists/updateFromServer_validate");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const axios = require('axios');
const inquirer = require('inquirer');
const path = require("path");
const { error } = require('console');
const Listr = require('listr');
let cacheCustomizationsFile;

const DOG_FOODING = "dogfooding.cultofbits.com"
const CONCURRENT_SCRIPT_URL = `https://${DOG_FOODING}/integrationm/concurrent/GithubCustomizationsVersions`

async function updateRecordmCustomizationVersions(args) {
    
    try {

        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        if (cmdEnv.currentBranch != "master" && cmdEnv.currentBranch != "main"){
            console.error("\n","THE CURRENT BRANCH IS NOT MASTER!","\n")
            return
        }

        await validateUpdateFromServerConditions(cmdEnv).run()

        const fs = require('fs');
        axios.defaults.headers.common['Cookie'] = await getRecordmToken(fs);

        //Read local customization version
        var localCustomizations = JSON.parse(fs.readFileSync(`${process.cwd()}/customizations.json`, 'utf8'));
        let localSimpleNameWithVersion_Map = []

        // update the versions from github to recordm
        axios.defaults.validateStatus = ()=>true
        const concurrentResponse = (await axios.post(CONCURRENT_SCRIPT_URL));
        if (concurrentResponse.status != 200){
            throw new Error(`Update versions from github to recordm failed. Status ${concurrentResponse.status}. Error: ${concurrentResponse.data.error}`);
        }

        //extract simple customization names, eg: customize.dashboard.dash -> dash
        for (const key in localCustomizations) {
            const splitStrs = key.split(".")
            const simpleCustomizationName = splitStrs[splitStrs.length-1]
            localSimpleNameWithVersion_Map.push({customizationName:simpleCustomizationName,version:localCustomizations[key]})
        }
    
        //build the query to fetch from recordm versions that exist locally
        const orQuery = localSimpleNameWithVersion_Map
                        .map( entry => `"${toRecordmVersionID(entry.customizationName,entry.version)}"`)
                        .join(' OR ')
        const repositorio_customizacoes_query = encodeURIComponent(`repositório_reference:"${cmdEnv.server}"  versão_reference:(${orQuery})`)

        // Get local versions registered on recordm
        axios.defaults.validateStatus = ()=>true
        const localVersionsOnRecordm = (await axios.get(`https://${DOG_FOODING}/recordm/recordm/definitions/search?def=${encodeURIComponent("Repositório-Customizações")}&q=${repositorio_customizacoes_query}`)).data.hits.hits;

        // Get the running server repo id in the Def 'Repositórios'
        const repoId = await getRepoId(cmdEnv)
            
        // Register local versions not on Recordm  
        postLocalVersionsNotOnRecordm(localSimpleNameWithVersion_Map,localVersionsOnRecordm,repoId)
  
    } catch(err) {
        console.error("\n",err.message)
        console.log(`OBS: If it is a 403 status code, delete ${cacheCustomizationsFile}`);
    }
}

//Auxliary functions
async function postLocalVersionsNotOnRecordm(localVersions,remoteVersions,maquinaId){
    let versionsUpdated = []
    let versionsNotFoundOnRecordm = []
    let record
    let found
    //fazer uma query com todas as versões locais do servidor não registadas
    let query = `version_id:(` 

    for (const key in localVersions) {
        found = false
        const localObj = localVersions[key]
        const version_id = toRecordmVersionID(localObj.customizationName,localObj.version).toLocaleLowerCase()
        //checks if this local version exists on recordm
        for (index in remoteVersions){
            record = remoteVersions[index]["_source"]
            if (record["version_id"] && version_id == record["version_id"][0].toLocaleLowerCase()){
                found = true
                break
            }
        }

        if (!found){
            query = versionsNotFoundOnRecordm.length == 0 ? `${query} "${version_id}"` : `${query} OR "${version_id}"`
            versionsNotFoundOnRecordm.push(version_id)
        }
    }
    if(versionsNotFoundOnRecordm.length > 0){
        axios.defaults.validateStatus = ()=>true
        const localVersionsNotRegisteredResponse = (await axios.get(`https://${DOG_FOODING}/recordm/recordm/definitions/search?def=${encodeURIComponent("Versões das Customizações")}&q=${query})`))
        if(localVersionsNotRegisteredResponse.status != 200){
            throw error(localVersionsNotRegisteredResponse.data)
        }
        const localVersionsNotRegistered = localVersionsNotRegisteredResponse.data.hits.hits;
    
        for (const index in localVersionsNotRegistered) {
            record = localVersionsNotRegistered[index]["_source"]
            const result = await axios.post(CONCURRENT_SCRIPT_URL,requestDataRepoCustomization(maquinaId,record.instanceId));
            if (result.data.id > 0 ) {
                versionsUpdated.push(record["version_id"][0].toLocaleLowerCase())
            } else {
                console.error("Failed to update the versions!")
            }
        }    
    }
    
    let difference = versionsNotFoundOnRecordm.filter(x => !versionsUpdated.includes(x));

    console.log("Local customization versions not found on definition <Repositório-Customizações>: ",versionsNotFoundOnRecordm)
    //console.log("Local customization versions updated: ",versionsUpdated)
    console.log("Local customization versions not updated: ",difference)

}

function toRecordmVersionID(customizationName,version){
    return `${customizationName} - v${version}`
}

function requestDataRepoCustomization(maquinaId,customizationVersionInstanceId){
    return {
        "saveToRecordm":true,
        "repositório":maquinaId,
        "version":customizationVersionInstanceId,
        "definition":"Repositório-Customizações"
    }
}

function requestDataRepositorios(serverEnv){
    return {
        "saveToRecordm":true,
        "repositório":serverEnv,
        "definition":"Repositórios"
    }
}

async function getRepoId(cmdEnv) {
    const maquinaIdQuery = `repositório:"${cmdEnv.server}"`
    const maquinaIdResponse = ( await axios
        .get(`https://${DOG_FOODING}/recordm/recordm/definitions/search?def=${encodeURIComponent("Repositórios")}&q=${encodeURIComponent(maquinaIdQuery)}`)).data.hits.hits
        
    let maquinaId 
    if ( maquinaIdResponse.length > 0 ){
        maquinaId = maquinaIdResponse[0]._source.instanceId;
    } else {

        maquinaId = ( await axios.post(CONCURRENT_SCRIPT_URL,requestDataRepositorios(cmdEnv.server) ) ).id
    }
    return maquinaId
}

async function getRecordmToken(fs) {
    const MS_29_MINUTES = 1740000
    const configFileName =  "dogFoodingRmToken.json"
    const { xdgData } = await import("xdg-basedir");
    const cacheDir = path.resolve(xdgData,"cob-cli")
    cacheCustomizationsFile = path.resolve(cacheDir,configFileName)

    var cobTokenJSON
    if (fs.existsSync(cacheCustomizationsFile)){
        cobTokenJSON = JSON.parse(fs.readFileSync(cacheCustomizationsFile, 'utf8'));
    }
    let cobToken;
    if (cobTokenJSON && cobTokenJSON.expirationDate &&  ( cobTokenJSON.expirationDate > Date.now() )){
        cobToken = cobTokenJSON.cobToken
    } else {
        const answer = await inquirer.prompt([
            {
                name: 'username',
                message: 'username da dogfooding:'
            },
            {
                type: 'password',
                name: 'secret',
                message: 'password:',
                mask:true
            }
        ])
        axios.defaults.headers.common['Content-Type'] = 'application/json'
        axios.defaults.withCredentials = true
        axios.defaults.validateStatus = ()=>true

        const response = await axios.post(`https://${DOG_FOODING}/recordm/security/auth`,{username:answer.username,password:answer.secret});

        if (200 == response.status){
            cobToken = "cobtoken="+response.data.securityToken
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            fs.writeFileSync(cacheCustomizationsFile, JSON.stringify({cobToken:cobToken,expirationDate:Date.now()+MS_29_MINUTES}, null, 2), (err) =>  {
                  if(err) throw new Error("\nError: ".red + " problem writing " + cacheCustomizationsFile + ":", err.message);
                }
            );
        } else {
            throw new Error(`Login Failed. Status ${response.status}. Error: ${response.data.error}`);
        }
        
    }

    return cobToken
}
module.exports = updateRecordmCustomizationVersions;