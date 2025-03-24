require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const axios = require("axios");
const fs = require("fs/promises");

async function getGroups(query, servername) {

	const uri = `https://${servername}.cultofbits.com/userm/userm/search/userm/group?`
	const response = await axios.get( uri + new URLSearchParams({
	   q: query,
	   size: "100" // probably excessive
	}));
	
	if(response.status != 200){
	   throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
	}
	const groupIds = response.data.hits.hits.map((h) => h._id)
	return groupIds;
 };

 const sortByName = (a, b) => a.name?.localeCompare(b.name);

 const exportGroups = async function(ids, servername, exportPath){
	
	const uri = `https://${servername}.cultofbits.com/userm/userm/group/export/${ids.join(',')}`
 
	const response = await axios.get( uri );
	if(response.status != 200 ){
	   throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
	}
	const data = response.data;
 
	// sort everything to be easier to diff
	data.groups?.sort(sortByName);
	data.groups?.forEach(group => group.roles?.sort())
	data.roles?.sort(sortByName);
	data.roles?.forEach(role => role.perms?.sort())
	data.perms?.sort(sortByName);
 
	fs.writeFile(exportPath, JSON.stringify(data))

 };

async function groupsFromServer(servername, groupsQueries, exportPath, customization) {
	const searchTasks = groupsQueries.map( gp => 
		({ title: `(${customization}) Permissions: `.bold + "searching for groups with query: " + gp,
			task: async ctx => ctx.groupIds = ctx.groupIds 
											? ctx.groupIds.concat(await getGroups(gp, servername))
										    :  await getGroups(gp, servername) }))
	


	await new Listr(
	[
		...searchTasks,
		{   title: `(${customization}) Permissions: `.bold + "exporting groups and subsequent roles/permissions", task: ctx => exportGroups(ctx.groupIds, servername, exportPath)},
	],{
		renderer: UpdaterRenderer,
		collapse: false
	})
	.run()
}


exports.getGroupsFromServer = groupsFromServer


