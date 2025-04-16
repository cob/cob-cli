require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const axios = require("axios");
const fs = require("fs/promises");

async function domainsFromServer(servername, domainsFilter, exportPath, customization, args) {
	await new Listr(
	[
		{ title: `(${customization}) Domains: `.bold + "searching for domains matching the queries" ,
			task: async ctx => ctx.domains = await getDomains(servername, domainsFilter, exportPath) },
		{ title: `(${customization}) Domains: `.bold + "exporting domains " ,
			task: ctx => ctx.domains.forEach( d => exportDomain(d, exportPath))  }
	],{
        renderer: args.verbose ? VerboseRenderer : UpdaterRenderer,
		collapse: false
	})
	.run()
}

	 

function match(query, domain) {
	// simple matching for now
	return (domain.name && domain.name.includes(query)) ||
		   (domain.description && domain.description.includes(query) )
}

async function getDomains(servername, filters, exportPath) {

	const uri = `https://${servername}.cultofbits.com/recordm/recordm/domains`
	const response = await axios.get( uri );
	
	if(response.status != 200){
	   throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
	}

	const matchesAny = (domain) => filters.filter(q => match(q, domain)).length > 0;

	return response.data.filter( matchesAny )
}

async function exportDomain(domain, rootPath) {
    const d = {
        name: domain.name,
        definitions: domain.definitions.map(d => d.name).sort()
    }
	await fs.writeFile(rootPath + domain.name + ".json", JSON.stringify(d, null, 2) )
}


exports.getDomainsFromServer = domainsFromServer
