const { getCurrentCommandEnviroment } = require("../task_lists/common_enviromentHandler");
const { checkRepoVersion } = require("../commands/upgradeRepo");
const fs = require('fs');
const fg = require('fast-glob');
const path = require('path')
const axios = require('axios');
const FileCookieStore = require('file-cookie-store');

async function generateMermaid(args) {
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
        const tables = new Set();
        for(const def of defs){
            refs.push(...getRefs(def.name, def.fieldDefinitions, args.debug));
            references.push(...getReferences(def.name, def.fieldDefinitions, args.debug));
            tables.add(def.name);
        }
        refs = uniqBy(refs, r => r.one + ":" + r.many)
        references = uniqBy(references, r => r.one + ":" + r.many)
        if(args.debug) console.error(
            'refs: ', refs,
            'references: ', references
        )

        // Output table defs
        for(const table of tables){
            const id = toMermaidId(table)
            console.debug(`\t${id}["${table}"]{}`) 
        }
        console.debug("")
        // Output relations
        for (const ref of refs) {
            // Only output relations that involve tables not excluded (or if arg to include referenced tables is present)
            if(args.includeReferencedTables || tables.has(ref.one) && tables.has(ref.many)) {                
                const one = toMermaidId(ref.one);
                const many = toMermaidId(ref.many);
                const left = '|o';
                const right = (ref.required ? '|' : 'o') + '{';
                const msgType = references.some(r => r.one === ref.one && r.many === ref.many) ? "hasMany" : "isOf"
                let msg = "";
                switch (args.labels) {
                    case "en":
                        msg = msgType == "hasMany" ? `${ref.one} have many ${ref.many}` : `_${ref.fieldName}_ is one of ${ref.one}`;
                        break;
                    case "pt":
                        msg = msgType == "hasMany" ? `${ref.one} têm ${ref.many}` : `_${ref.fieldName}_ refere um registo de ${ref.one}`;
                        break;
                    case "es":
                        msg = msgType == "hasMany" ? `${ref.one} tienen ${ref.many}` : `_${ref.fieldName}_ se refiere a un registro de ${ref.one}`;
                        break;
                }
    
                console.debug(`\t${one} ${left}..${right} ${many}: " ${msg}"`)
            }
        }
    } catch(err) {
        console.error("\n",err.message);
    }
}
module.exports = generateMermaid;

async function readDefsFromDisk(dir, filter, debug) {
    if(debug) console.error(`Reading Definitions from ${dir}`);
    const defFiles = await fg([`${dir}/*.json`]);
    return defFiles
        .map((f) => JSON.parse(fs.readFileSync(f)))
        .filter(def => relevant(def,filter))
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
    defs = defs.filter(def => relevant(def,filter))

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
        if (fd.configuration.keys.Reference && !fd.configuration.keys.AutoRefField) {
            // if(debug) console.error('using fieldDefinition', fd) 
            acc.push({
                one: fd.configuration.keys.Reference.args.definition,
                many: defName,
                fieldName: fd.name,
                required: !!fd.required,
            });
        }
        if (fd.fields) acc.push(...getRefs(defName, fd.fields));
        return acc;
    }, [])
}

function getReferences(defName, fieldDefs, debug) {
    return fieldDefs.reduce((acc, fd) => {
        if (fd.configuration.keys.References) {
            // if(debug) console.error('using fieldDefinition', fd.name, fd.configuration.keys.References) 
            acc.push({
                one: defName,
                many: fd.configuration.keys.References.args.definition,
            });
        }
        if (fd.fields) acc.push(...getReferences(defName, fd.fields));
        return acc;
    }, [])
}

function toMermaidId(name) {
    return name.normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\./g, "_")
        .replace(/ /g, "_");
}

function uniqBy(a, key) {
    const seen = new Set();
    return a.filter(item => {
        const k = key(item);
        return seen.has(k) ? false : seen.add(k);
    });
}

function relevant(def,filter) {
    return !filter 
        || filter
        .split(" ")
        .every( filterPart => {
            if(filterPart.startsWith("-")) {
                filterPart = filterPart.substring(1)
                return !def.name.match(filterPart) && !def.description?.match(filterPart)  
            } else {
                return def.name.match(filterPart) || def.description?.match(filterPart)
            }
        })
}
