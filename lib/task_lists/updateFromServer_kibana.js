require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const axios = require("axios");
const fs = require("fs/promises");

async function exportSpace(servername, space, filePath, args) {

    const uri = `https://${servername}.cultofbits.com/kibana/api/spaces/space/${space.toLowerCase()}`
    const response = await axios.get( uri, {
        headers: {
            "kbn-xsrf": "true"
        },
        transformResponse: [] // Prevents any response transformation
    } );

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    await fs.writeFile(filePath, response.data)
}

async function exportSavedObjectsOfSpace(servername, space, filePath, args) {

    const uri = `https://${servername}.cultofbits.com/kibana/s/${space.toLowerCase()}/api/saved_objects/_export`
    const response = await axios.post( uri, {
        type: [
            "config",
            "url",
            "index-pattern",
            "query",
            "tag",
            "canvas-element",
            "canvas-workpad",
            "action",
            "alert",
            "visualization",
            "dashboard",
            "map",
            "lens",
            "cases",
            "search",
        ],
        includeReferencesDeep: true,
        excludeExportDetails: true
    }, {
        headers: {
            "kbn-xsrf": "true"
        },
        transformResponse: [] // Prevents any response transformation
    } );

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    const settings = response.data.split("\n")
        .map(e => JSON.parse(e))

    await Promise.all( settings
        .filter(e => e.type === 'index-pattern')
        .map(async element => await replaceIndexPatternsIds(servername, element, args))
    )

    // sort export, apparently its needed because it doesn't respect precedences
    const priorities = {
        'config': 1,
        'index-pattern': 2
    }
    settings.sort(function(a,b){
        const pA = priorities[a.type] || 999;
        const pB = priorities[b.type] || 999;
        return pA - pB
    })

    await fs.writeFile(filePath, settings.map(s => JSON.stringify(s)).join("\n"))
}

// replaces in place
async function replaceIndexPatternsIds(servername, indexPattern, args) {
    if(indexPattern.type !== "index-pattern"){
        throw new Error("Not an index pattern")
    }

    // if(args.verbose){
    //     console.log("replacing ids in index-pattern", indexPattern)
    // }

    const definitionId = indexPattern.attributes.title.substring('recordm-'.length)
    const name = await getDefinitionName(servername, definitionId)
    if(args.verbose){
        console.log("definition id", definitionId, "mapped to", name)
    }

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

    const taskList = spaces.flatMap( space => [
        {
           title: `(${customization}) Kibana: `.bold + `Exporting ${space}`,
           task: async () => await exportSpace(servername, space, roothpath + `/${space}.json`, args)
        },
        {
           title: `(${customization}) Kibana: `.bold + `Exporting ${space} objects`,
           task: async () => await exportSavedObjectsOfSpace(servername, space, roothpath + `/${space}.ndjson`, args)
        }
    ])

    await new Listr( taskList, {
        renderer: args.verbose ? VerboseRenderer : UpdaterRenderer,
        collapse: false
    }).run()
}

exports.getKibanaFromServer = getKibanaFromServer
