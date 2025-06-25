require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
const { getFilteredDefinitions } = require('./common_definitions.js')
const axios = require("axios");
const inquirer = require("inquirer")

async function getUntaggedChanges(servername, defId) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${defId}/changes?tagged=false`

    const response = await axios.get(uri, {params: {tagged: false}});

    if(response.status % 200 > 100){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    return ( response.data || []).filter(c => !c.tag)
}

async function tagDefinition(servername, defId, until) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions/${defId}/tag`

    const params = {}
    if(until) {
        params.until = until
    }
   
    const response = await axios.put(uri, null, {params: params});

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

                        if(args.all) {
                            await tagDefinition(servername, d.id)
                            task.output = 'Tagged by all'
                            return
                        }

                        d.changes.forEach(c => console.log(JSON.stringify(c)))

                        const answer = await inquirer.prompt([
                            {
                                type: 'rawlist',
                                name: 'action',
                                message: `Do you wish to tag the ${d.changes.length} changes? (^c to abort)`,
                                choices: [
                                    'Tag Changes',
                                    'Choose Changes',
                                    'Skip',
                                ]
                            }
                        ])
                        if (answer.action == 'Skip') {
                            task.skip()

                        } else if (answer.action == 'Tag Changes') {
                            await tagDefinition(servername, d.id)
                            task.output = 'Tagged'

                        } else if (answer.action == 'Choose Changes') {
                           const dates = d.changes.reduce((acc, cur) => {
                              if(!acc.includes(cur.date)) acc.push(cur.date)
                              return acc
                           }, [])
                           const answerDate = await inquirer.prompt([
                              {
                                type: 'rawlist',
                                name: 'date',
                                message: `Choose the oldest date to tag`,
                                choices: dates
                              }
                           ])
                           await tagDefinition(servername, d.id, answerDate.date)
                           task.output = 'Tagged until ' + answerDate.date
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
