require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const axios = require("axios");
const fs = require("fs/promises");


async function getInstancesFromServer(servername, definitionsForInstances, rootPath, customization) {

	const taskList = definitionsForInstances.map( def => ({
		title: `(${customization}) Instances: `.bold + `Exporting instances from definition ${def.definition}`,
		task: async ctx => getInstancesOfDefinition(servername, await getDefinition(servername, def.definition), def.query, rootPath) 
	}))

	await new Listr(taskList , {
		renderer: UpdaterRenderer,
		collapse: false
	}).run()



}

function getFieldList(definition) {
	return Array.from(
		new Set(flattenFields(definition.fieldDefinitions))
	).join(',')
}
function flattenFields(fieldArray) {
	if (!fieldArray || fieldArray.length == 0)
		return []

	return fieldArray.flatMap(field => flattenFields(field.fields).concat([field.name]))
}


async function getInstancesOfDefinition(servername, definition, query, rootPath) {

	const definitionId = definition.id

	const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/search/download/${definitionId}?`
	const response = await axios.get(uri + new URLSearchParams({
		q: query,
		vcn: getFieldList(definition)
	}), {
		responseType: 'arraybuffer',
	});

	fs.writeFile(rootPath + `${definition.name}.xlsx`, response.data)

}

async function getDefinition(servername, definitionName) {

	const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/name/${definitionName}`
	const response = await axios.get(uri);

	return response.data
}


exports.getInstancesFromServer = getInstancesFromServer