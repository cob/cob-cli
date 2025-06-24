require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const { getKeypress } = require('./common_helpers.js')
const { getFilteredDefinitions } = require('./common_definitions.js')
const axios = require("axios");
const fs = require("fs/promises");

async function getUntaggedChanges(servername, defId) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${defId}/changes?tagged=false`

    const response = await axios.get(uri, {params: {tagged: false}});

    if(response.status % 200 > 100){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    return ( response.data || []).filter(c => !c.tag)
}

async function tagDefinition(servername, defId) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${defId}/tag`

    const response = await axios.put(uri);

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    return response.data
}

async function tagDefinitions(servername, customization, defs, args) {
    return new Listr([
        {
            title: `(${customization}) Definitions: `.bold + "searching for definitions matching queries",
            task: async ctx => ctx.defs = (await getFilteredDefinitions(servername, defs))
            .map(d => ({id: d.id, name: d.name})) 
        },
        {
            title: `(${customization}) Definitions: `.bold + "enriching metadata",
            task: async ctx => {
                for (const def of ctx.defs){
                    def.changes = await getUntaggedChanges(servername, def.id)
                    if(args.verbose) console.log(`definition ${def.name}: ${def.changes.length} untagged changes`)
                }
            }
        },
        {
            title: `(${customization}) Definitions: `.bold + "tagging un-tagged changes",
            task: async ctx => {
                const subtasks = ctx.defs.map(d => ({
                    title: "Tagging changes to " + d.name.bold,
                    task: async (_, task) => {
                        if (d.changes.length == 0) {
                            task.skip("no untagged changes")
                            return
                        }

                        if(args.all || ctx.all ) {
                            await tagDefinition(servername, d.id)
                            task.output = 'Tagged by all'
                            return
                        }

                        d.changes.forEach(c => console.log(JSON.stringify(c)))

                        console.log(`Do you wish to tag the ${d.changes.length} changes? Yy/Nn/aA (^c to abort)`)
                        const answer = await getKeypress();

                        if (answer == 'ctrl+c') {
                            throw new Error('User aborted')

                        } else if (answer.toLowerCase() == 'n') {
                            task.skip('skipping')

                        } else {
                            await tagDefinition(servername, d.id)
                            task.output = 'Tagged'
                            ctx.all = answer.toLowerCase() == 'a'
                        }
                    }
                }))
                return new Listr(subtasks)
            }
        },
    ],{
        // we need to list changes and read user input, the VerboseRenderer is needed
        renderer: VerboseRenderer,
        collapse: false
    }).run()
}


exports.tagDefinitions = tagDefinitions
