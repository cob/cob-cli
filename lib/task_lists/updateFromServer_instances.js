require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const axios = require("axios");
const fs = require("fs/promises");


async function getInstancesFromServer(servername, definitionsForInstances, rootPath, customization, args) {

    const taskList = definitionsForInstances.map( def => ({
        title: `(${customization}) Instances: `.bold + `Exporting instances from definition ${def.definition}`,
        task: async ctx => getInstancesOfDefinition(servername, await getDefinition(servername, def.definition), def.query, rootPath)
    }))

    await new Listr(taskList , {
        renderer: args.verbose ? VerboseRenderer : UpdaterRenderer,
        collapse: false
    }).run()
}

function flattenFields(fieldArray) {
    if (!fieldArray || fieldArray.length == 0)
        return []

    return fieldArray.flatMap(field => flattenFields(field.fields).concat([field]))
}
function getFieldList(fields) {
    return Array.from(new Set(fields.map(f => f.name))).join(',')
}


async function getInstancesOfDefinition(servername, definition, query, rootPath) {

    const definitionId = definition.id
    const fields = flattenFields(definition.fieldDefinitions)

    if(!fields.some(f => (f.description || '').includes('$instanceLabel'))){
        throw new Error("Should not export instances of a Definition without an $instanceLabel field, it would generate duplicates on import")
    }

    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/search/download/${definitionId}?`
    const response = await axios.get(uri + new URLSearchParams({
        q: query,
        vcn: "id," + getFieldList(fields)
    }), {
        responseType: 'arraybuffer',
        headers: {'export-files': 'true'}
    });

    fs.writeFile(rootPath + `${definition.name}.xlsx`, response.data)

}

async function getDefinition(servername, definitionName) {

    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/name/${encodeURIComponent(definitionName)}`
    const response = await axios.get(uri);

    return response.data
}


exports.getInstancesFromServer = getInstancesFromServer
