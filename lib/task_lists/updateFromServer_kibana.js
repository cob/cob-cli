require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const axios = require("axios");
const fs = require("fs/promises");

async function exportSavedObjectsOfSpace(servername, space, filePath) {

	const uri = `https://${servername}.cultofbits.com/kibana/s/${space.toLowerCase()}/api/kibana/management/saved_objects/_find?perPage=1000&type=config&type=url&type=index-pattern&type=query&type=tag&type=canvas-element&type=canvas-workpad&type=action&type=alert&type=visualization&type=dashboard&type=map&type=lens&type=cases&type=search&sortField=type`
	const response = await axios.get( uri );

	if(response.status != 200){
		throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
	 }

	await Promise.all(response.data.saved_objects.map(async element => { if(element.type === "index-pattern") await replaceIndexPatternsIds(servername, element) }))

	fs.writeFile(filePath, JSON.stringify(response.data.saved_objects, null, 2))
}

// replaces in place
async function replaceIndexPatternsIds(servername, indexPattern) {
	if(indexPattern.type !== "index-pattern"){
		throw new Error("Not an index pattern")
	}

	const definitionId = indexPattern.meta.title.substring('recordm-'.length)
	const name = await getDefinitionName(servername, definitionId)	

	indexPattern.meta.title = `recordm-§§${name}§§`
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
		{   title: `(${customization}) Kibana: `.bold + `Exporting ${space}`,   task: async ctx => ctx.groupIds = await exportSavedObjectsOfSpace(servername, space, roothpath + `/${space}.json`) }
	))

	await new Listr( taskList, {
         renderer: args.verbose ? VerboseRenderer : UpdaterRenderer,
			collapse: false
		})
		.run()	
}

exports.getKibanaFromServer = getKibanaFromServer
