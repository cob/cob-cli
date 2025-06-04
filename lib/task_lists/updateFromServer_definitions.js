require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const axios = require("axios");
const fs = require("fs/promises");


async function getDefinitions(servername, defs) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions`
    const response = await axios.get( uri );

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    let result = await Promise.all(defs.flatMap(d => {
        return response.data
            .filter(def => match(d.filter, def))
            .map(def => ({id: def.id, name: def.name, views: d.views}))
    }).map(async d => ({ ...d, refs: await getRefs(servername, d)})));

    // we'll sort by refs, Defs that reference others must come after them
    result.sort((a, b) => {
        if (a.refs.includes(b.name)){
            return 1;
        }

        if(b.refs.includes(a.name)){
            return -1;
        }

        return a.refs.length - b.refs.length;
    })

    return result
}

function match(query, definition) {
    // simple matching for now
    return definition.name.includes(query) || definition.description?.includes(query)
}

async function getRefs(servername, def) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${def.id}`
    const response = await axios.get(uri);

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    const fields = response.data.fieldDefinitions;
    return [...new Set(get$Refs(fields))];
}
function get$Refs(fields){
    let refs = [];
    for(f of fields){
        if(f.configuration.keys.Reference){
            refs.push(f.configuration.keys.Reference.args.definition);
        }
        if(f.fields) {
            const childRefs = get$Refs(f.fields);
            if(childRefs.length > 0) refs.push(...childRefs)
        }
    }
    return refs
}

async function exportDefinitionChanges(servername, def, dataPath) {

    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${def.id}/changes`
    const response = await axios.get(uri);

    if(response.status == 204){
        // this is probably an error
        throw new Error(`Definition "${def.name}" [${def.id}] has no tagged Changes.`);

    } else if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    // write every change on a single line
    const stringified = "[\n" + response.data.map(change => "  " + JSON.stringify(change)).join(',\n') + "\n]\n";

    await fs.writeFile(dataPath, stringified, 'utf-8');
}

async function getViewsForDef(servername, definition, dataPath) {
    const definitionId = definition.id
    const uri = `https://${servername}.cultofbits.com/recordm/user/settings/${definition.views}/definitions-${definitionId}/views?`

    const response = await axios.get(uri);

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    let userViews = response.data.filter(v => v.isShared)

    if(response.data.length == 0)
        return

    userViews = response.data.map(v => {
        v.value = JSON.stringify( JSON.parse(v.value).filter(f => f.visible == true) )
        return v
    })

    const jsonLines = userViews.map(v => JSON.stringify({
        key: v.key,
        value: v.value,
        user: v.user,
    })) .join('\n');

    await fs.writeFile(dataPath, jsonLines)
}

function getDefinitionsFromServer(servername, defs, definitionsPath, viewsPath, customization, args) {

    return new Listr(
        [
            {
                title: `(${customization}) Definitions: `.bold + "searching for definitions matching queries",
                task: async ctx => ctx.defs = await getDefinitions(servername, defs) 
            },
            {
                title: `(${customization}) Definitions: `.bold + "exporting changes",
                task: async ctx => {
                    let idx = 1;
                    for( d of ctx.defs ){ await exportDefinitionChanges(servername, d, definitionsPath + `${String(idx++).padStart(2, '0')} - ${d.name}.json`)}
                }
            },
            {
                title: `(${customization}) Definitions: `.bold + "exporting views",
                task: async ctx => { for (d of ctx.defs.filter(d => d.views )){ await getViewsForDef(servername, d, viewsPath + `${d.name}.jsonl`)} }
            },
        ],{
            renderer: args.verbose ? VerboseRenderer : UpdaterRenderer,
            collapse: false
        })
}


exports.getDefinitionsFromServer = getDefinitionsFromServer
