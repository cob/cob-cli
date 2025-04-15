require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const axios = require("axios");
const fs = require("fs/promises");


async function getDefinitions(servername, queries) {

	const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions`
	const response = await axios.get( uri );

	if(response.status != 200){
		throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
	 }

	const matchesAny = (def) => queries.filter(q => match(q, def)).length > 0;
	 
	return response.data
		.filter( matchesAny )
		.map( def => ({id: def.id, name: def.name}) )
}

function match(query, definition) {
	// simple matching for now
	return definition.name.includes(query) || definition.description.includes(query) 
}

async function exportDefinitionChanges(servername, id, dataPath) {

	const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${id}/changes`
	const response = await axios.get(uri);

	if(response.status != 200){
		throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
	 }

	const jsonLines = response.data.map(change => JSON.stringify(change)).join('\n');

	await fs.writeFile(dataPath, jsonLines, 'utf-8');
}

async function getViewsForDef(servername, definition, dataPath, user) {
	const definitionId = definition.id
	const uri = `https://${servername}.cultofbits.com/recordm/user/settings/definitions-${definitionId}/views?`

	const response = await axios.get(uri);

	 if(response.status != 200){
		throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
	 }

	 const userViews = response.data.filter(v => v.user == user)

	 if(userViews.length == 0)
		return

	 const jsonLines = userViews.map(change => JSON.stringify(change))
								.join('\n');

	await fs.writeFile(dataPath, jsonLines)

 }

async function getDefinitionsFromServer(servername, queries, definitionsPath, viewsPath, customization, user) {

		await new Listr(
		[
         { 
            title: `(${customization}) Definitions: `.bold + "searching for definitions matching queries",
            task: async ctx => ctx.defs = await getDefinitions(servername, queries)
         },
         {
            title: `(${customization}) Definitions: `.bold + "exporting changes for definitions",
            task: ctx => ctx.defs.forEach( d => exportDefinitionChanges(servername, d.id, definitionsPath + `${d.name}.jsonl`) )
         },
         {
            title: `(${customization}) Definitions: `.bold + "exporting views for definitions",
            task: ctx => ctx.defs.forEach( d => getViewsForDef(servername, d, viewsPath + `${d.name}.jsonl`, user) )
         },
		],{
			renderer: UpdaterRenderer,
			collapse: false
		})
		.run()
	
}


exports.getDefinitionsFromServer = getDefinitionsFromServer
