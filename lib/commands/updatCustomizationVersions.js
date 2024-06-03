require('colors');
const { getCurrentCommandEnviroment } = require("cob-cli/lib/task_lists/common_enviromentHandler");
const { validateUpdateFromServerConditions } = require("cob-cli/lib/task_lists/updateFromServer_validate");
const { checkRepoVersion } = require("cob-cli/lib/commands/upgradeRepo");
const axios = require('axios');

async function updateRecordmCustomizationVersions(args) {
    axios.defaults.withCredentials = true
    axios.defaults.headers.common['Cookie'] = "cobtoken=dsa+dasddadsa+dsadsa+saddsa+HYh/fsfdsfds/dsadsadsaas==";
    axios.defaults.headers.common['Content-Type'] = 'application/json'
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        await validateUpdateFromServerConditions(cmdEnv).run()

        //Read local customization version
        var fs = require('fs');
        var customizations = JSON.parse(fs.readFileSync(`${process.cwd()}/customizations.json`, 'utf8'));
        let customizationName //
        let transformedCustomizations = []
        let query = `máquina_reference:"${cmdEnv.server}"  versão_reference:(`
        const initialQueryLen = query.length
        for (const key in customizations) {
            const splitStrs = key.split(".")
            customizationName = splitStrs[splitStrs.length-1]
            
            transformedCustomizations.push({customization:customizationName,version:customizations[key]})

            if (initialQueryLen == query.length){
                query = `${query} "${toVersionID(customizationName,customizations[key])}"`
            } else {
                query = `${query} OR "${toVersionID(customizationName,customizations[key])}"`
            }
        }

        query = `${query} `

        query = `${encodeURIComponent(query).replace("(","%28")}%29`

        // Fetch the server's customization versions registered on Recordm
        const maquinaCustomizationsRequest = await axios.get(`https://${cmdEnv.server}/recordm/recordm/definitions/search?def=${encodeURIComponent("Máquina-Customizações")}&q=${query}`);

        // Get all customization versions
        const allVersions = await axios.get(`https://${cmdEnv.server}/recordm/recordm/definitions/search?def=${encodeURIComponent("Versões das Customizações")}&q=*`);
        
        const versionsMap = new Map();
        allVersions.data.hits.hits.forEach((obj) => {
            obj = obj["_source"]
            versionsMap.set(obj.version_id[0], obj.instanceId);
        });

        const maquinaIdQuery = `nome:"${cmdEnv.server}"`
        const maquinaId = ( await axios.get(`https://${cmdEnv.server}/recordm/recordm/definitions/search?def=${encodeURIComponent("Máquinas")}&q=${encodeURIComponent(maquinaIdQuery)}`)).data.hits.hits[0]._source.instanceId;

        // Register the server's customization versions not on Recordm
        localVersionsNotOnRecordm(transformedCustomizations,maquinaCustomizationsRequest.data.hits.hits,versionsMap,cmdEnv.server,maquinaId)
    } catch(err) {
        console.error("\n",err.message);
    }
}

async function localVersionsNotOnRecordm(localVersions,remoteVersions,versionsMap,server,maquinaId){
    let versionsUpdated = []
    let versionsNotFoundOnRecordm = []
    let record
    let found = false
    for (const key in localVersions) {
        const localObj = localVersions[key]
        const version_id = toVersionID(localObj.customization,localObj.version).toLocaleLowerCase()
        for (index in remoteVersions){
            record = remoteVersions[index]["_source"]
            if (version_id == record["version_id"][0].toLocaleLowerCase()){
                found = true
                break
            }
        }

        if (!found){
            const instanceId = versionsMap.get(version_id)
            if (instanceId){
                const result = await axios.post(`https://${server}/recordm/recordm/instances?waitFor=false`,
                    getNewMaquinaCustomizationInstance(maquinaId,instanceId)
                );
                if (result.status == 200 && result.data.errors.length != 0 ) {
                    console.log(`Failed to update. Error: <${result.errors}>`)
                }
                versionsUpdated.push(version_id)
            }else{
                versionsNotFoundOnRecordm.push(version_id)
            }
        }
        found = false
    }

    console.log("Local customization versions updated: ",versionsUpdated)
    console.log("Local customization versions not found on definition <Versões das Customizações>: ",versionsNotFoundOnRecordm)
}

function toVersionID(customizationName,version){
    return `${customizationName} - v${version}`
}

function getNewMaquinaCustomizationInstance(maquinaId,customizationVersionInstanceId){
    return {
        "jsonDefinition": {
          "id": 271,
          "name": "Versões das Customizações"
        },
        "fields": [
          {
            "fieldDefinition": {
              "id": 4098,
              "name": "Máquina"
            },
            "value": maquinaId
          },
          {
            "fieldDefinition": {
              "id": 4092,
              "name": "Versão"
            },
            "value": customizationVersionInstanceId
          }
        ]
    }
}
module.exports = updateRecordmCustomizationVersions;