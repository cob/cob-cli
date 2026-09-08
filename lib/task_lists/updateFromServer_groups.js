require('colors');
const Listr = require('listr');
const UpdaterRenderer = require('listr-update-renderer');
const VerboseRenderer = require('listr-verbose-renderer');
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
    data.perms?.sort(sortByName)
    const re = /:(\d+)/g
    defnameCache.servername = servername;

    for(r of data.roles) {
        for(let i = 0; i < r.perms.length; i++){
            r.perms[i] = await replaceAsync(r.perms[i], re, replaceIdsWithName)
        }
    }
    for(p of data.perms){
        if( p.product == 'recordm') {
            p.name = await replaceAsync(p.name, re, replaceIdsWithName)
        }
    }

    fs.writeFile(exportPath, JSON.stringify(data, null, 2))

};

async function replaceIdsWithName(type, _m, g1){
    return ":" + ( "§§" + await defnameCache.get(g1, type) + "§§")
}

async function getGroupsFromServer(servername, groupsQueries, exportPath, customization, args) {
    const searchTasks = groupsQueries.map( gp =>
        ({ title: `(${customization}) Permissions: `.bold + "searching for groups with query: " + gp,
            task: async ctx => ctx.groupIds = ctx.groupIds
            ? ctx.groupIds.concat(await getGroups(gp, servername))
            :  await getGroups(gp, servername) }))

    await new Listr(
        [
            ...searchTasks,
            {
                title: `(${customization}) Permissions: `.bold + "exporting groups and subsequent roles/permissions",
                task: ctx => exportGroups(ctx.groupIds, servername, exportPath)
            },
        ],{
            renderer: args.verbose ? VerboseRenderer : UpdaterRenderer,
            collapse: false
        })
        .run()
}

const defnameCache = {
    servername: '',
    resolved: new Map(),
    get: async function(id, type='definitions') {
        const key = `${type}:${id}`
        if(!this.resolved.has(key)){
            const uri = `https://${this.servername}.cultofbits.com/recordm/recordm/${type}/${id}`
            try {
               const response = await axios.get( uri );

               if(response.status != 200){
                   throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
               }

               this.resolved.set(key, response.data.name)
            } catch(err) {
               throw new Error(`Couldn't get the ${type} with id ${id}: ${err}`)

            }
        }

        return this.resolved.get(key)
    }
}

const typeOfPerm = function(name) {
   if (name.startsWith('domains:')) return "domains";

   return "definitions";
}

async function replaceAsync(string, regexp, replacerFunction) {
    const replacements = await Promise.all(
        Array.from(string.matchAll(regexp),
            match => replacerFunction(typeOfPerm(string), ...match)));
    let i = 0;
    return string.replace(regexp, () => replacements[i++]);
}

exports.getGroupsFromServer = getGroupsFromServer
