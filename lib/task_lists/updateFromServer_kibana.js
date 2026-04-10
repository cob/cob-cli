require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const axios = require("axios");
const fs = require("fs/promises");

const KIBANA_TYPES = ['config','url','index-pattern','query','tag','canvas-element','canvas-workpad','action','alert','visualization','dashboard','map','lens','cases','search'];

async function exportSavedObjectsOfSpace(servername, space, filePath, args) {
    const uri = `https://${servername}.cultofbits.com/kibana/s/${space.identifier}/api/saved_objects/_export`
    try {
        const response = await axios.post(uri, {
            type: KIBANA_TYPES,
            excludeExportDetails: true,
        }, {
            headers: { 'kbn-xsrf': 'true' },
            responseType: 'text',
        });

        const allObjects = response.data
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));

        await Promise.all(allObjects
            .filter(e => e.type === 'index-pattern')
            .map(async element => await replaceIndexPatternsIds(servername, element))
        )

        await fs.writeFile(filePath, allObjects.map(o => JSON.stringify(o)).join('\n'))
    } catch(err) {
        if(args.verbose > 0) {
            console.error("error downloading from kibana {status:", err.response?.status, ", uri:", uri)
        }
        throw err;
    }
}

async function exportIndex(spaces, dataPath) {
   await fs.writeFile(dataPath, spaces.map(s => s.identifier + ":" + s.name).join('\n'), 'utf-8')
}


// replaces in place
async function replaceIndexPatternsIds(servername, indexPattern) {
    if(indexPattern.type !== "index-pattern"){
        throw new Error("Not an index pattern")
    }

    const definitionId = indexPattern.attributes.title.substring('recordm-'.length)
    const name = await getDefinitionName(servername, definitionId)

    indexPattern.attributes.title = `recordm-§§${name}§§`
}

async function getDefinitionName(servername, id) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${id}`
    const response = await axios.get( uri );

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    return response.data.name
}

async function getKibanaFromServer(servername, spaces, roothpath, customization, args) {

    const taskList = spaces.map( space => (
        {
           title: `(${customization}) Kibana: `.bold + `Exporting ${space.name}`,
           task: async () => await exportSavedObjectsOfSpace(servername, space, roothpath + `/${space.name}.ndjson`, args)
        }
    ))

   taskList.push({
      title: `(${customization}) Kibana: `.bold + 'Exporting _index',
      task: async () => await exportIndex(spaces, roothpath + "/_index")
   })

    await new Listr( taskList, {
        renderer: args.verbose ? VerboseRenderer : UpdaterRenderer,
        collapse: false
    }).run()
}

exports.getKibanaFromServer = getKibanaFromServer
