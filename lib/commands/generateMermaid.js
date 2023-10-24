const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const fs = require('fs');
const fg = require('fast-glob');
const path = require('path')
const axios = require('axios');
const FileCookieStore = require('file-cookie-store');

async function getDefs(args) {
    try {
        checkRepoVersion()
        const cmdEnv = await getCurrentCommandEnviroment(args)

        if(args.debug) console.error(`Generating mermaid` );
        const defs = args.server 
            ? await readDefsFromServer(args.server, args.filter, args.debug)
            : await readDefsFromDisk(`recordm/definitions/${cmdEnv.name}`, args.filter, args.debug);

        console.log('erDiagram');
        let refs = [];
        let references = [];
        for(const def of defs){
            refs.push(...getRefs(def.name, def.fieldDefinitions, args.debug));
            references.push(...getReferences(def.name, def.fieldDefinitions, args.debug));
        }
        refs = uniqBy(refs, r => r.from + ":" + r.to)
        references = uniqBy(references, r => r.from + ":" + r.to)
        if(args.debug) console.error(
            'refs: ', refs,
            'references: ', references
        )

        const tables = new Set();
        for(const ref of refs){
            tables.add(ref.from);
            tables.add(ref.to);
        }

        // Output table defs
        for(const table of tables){
            const id = toMermaidId(table)
            console.debug(`\t${id}["${table}"]{}`)
        }
        console.debug("")
        // Output relations
        for(const ref of refs) {
            const from = toMermaidId(ref.from);
            const to = toMermaidId(ref.to);
            const left = '}o';
            const right = ( ref.required ? '|':'o') + (ref.duplicable ? '{' : '|');
            const msg = references.some(r => r.from === ref.from && r.to === ref.to) ? 'has many' : 'Is of';

            console.debug(`\t${from} ${left}..${right} ${to}: " ${ref.fieldName}"`)
        }

    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = getDefs;

async function readDefsFromDisk(dir, filter, debug) {
    if(debug) console.error(`Reading Definitions from ${dir}`);
    const defFiles = await fg([`${dir}/*.json`]);
    return defFiles
        .map((f) => JSON.parse(fs.readFileSync(f)))
        .filter(def => {
            return !filter || def.name.match(filter) || def.description?.match(filter)
        })
}

async function readDefsFromServer(server, filter, debug) {
    if(debug) console.error(`Reading Definitions from server ${server}`);

    const p = path.resolve(require('os').homedir(), '.cob-cookie');
    const cookieFile = new FileCookieStore(p, {auto_sync: false});
    const cobtoken = await readCobtoken(cookieFile, server);

    // get Defs
    let defs = (await axios.get(`https://${server}/recordm/recordm/definitions`,{
        headers: {
            Accept: "application/json",
            Cookie: cobtoken
        }
    })).data
    if(debug) console.error('found a total of ', defs.length, 'Defs');
    // filter
    if(filter) defs = defs.filter(def => {
        return def.name.match(filter) || def.description?.match(filter)
    })
    if(debug) console.error('filtered to ', defs.length, 'Defs');
    return await Promise.all(defs.map(async (def) => {
        return (await axios.get(`https://${server}/recordm/recordm/definitions/${def.id}`,{
            headers: {
                Accept: "application/json",
                Cookie: cobtoken
            }
        })).data
    }))
}

function readCobtoken(cookies, server){
    return new Promise((resolve, reject) => {
        cookies.findCookie(server, '/', 'cobtoken', (err, result) => {
            if(err != null) reject(err);
            else resolve(result);
        } )
    })
}

function getRefs(defName, fieldDefs, debug) {
    return fieldDefs.reduce((acc, fd) => {
        if(fd.configuration.keys.Reference && !fd.configuration.keys.AutoRefField){
            // if(debug) console.error('using fieldDefinition', fd) 
            acc.push({
                from: defName,
                to: fd.configuration.keys.Reference.args.definition,
                fieldName: fd.name,
                required: !!fd.required,
                duplicable: !!fd.duplicable
            });
        }
        if(fd.fields) acc.push(...getRefs(defName, fd.fields));
        return acc;
    }, [])
}

function getReferences(defName, fieldDefs, debug) {
    return fieldDefs.reduce((acc, fd) => {
        if(fd.configuration.keys.References){
            // if(debug) console.error('using fieldDefinition', fd.name, fd.configuration.keys.References) 
            acc.push({
                from: defName,
                to: fd.configuration.keys.References.args.definition
            });
        }
        if(fd.fields) acc.push(...getReferences(defName, fd.fields));
        return acc;
    }, [])
}

function toMermaidId(name){
    return name.normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/ /g, "_");
}

function uniqBy(a, key) {
    const seen = new Set();
    return a.filter(item => {
        const k = key(item);
        return seen.has(k) ? false : seen.add(k);
    });
}
