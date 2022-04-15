const ncp = require('ncp');
const path = require('path');
const {Transform} = require('stream')

// https://www.npmtrends.com/copyfiles-vs-cpx-vs-ncp-vs-npm-build-tools
// https://www.npmjs.com/package/ncp
// https://www.npmjs.com/package/copyfiles

function copy(source, target, substitutions = {}) {
    console.log("  Copying template files to '" + target + "'...")
    return new Promise(async (resolve) => {
        // Source is on cob-cli repo and Destination on the server repo
        await ncp(path.resolve(__dirname,source),
            target, 
            { 
                clobber: true,
                filter: (src) => src.match(/node_modules/) == null,
                // TODO: comentado porque não funciona a copiar os ficheiros binários (em concreto as font no template/dashboards/dash)
                // transform(read, write) {
                //     const replaceVars = new Transform({
                //         transform: (chunk, encoding, done) => done(null,chunk.toString().replace(/__.+__/g, m => substitutions[m]))
                //     }) 
                //     read.pipe(replaceVars).pipe(write)
                // }
            },
            (error,x) => {
                if (error) {
                    // Error is an array of problems
                    resolve(error.map(e => e.message).join("\n"));
                } else {
                    resolve();
                }
            }
        );
        
        const { renameSync } = require('fs');
        const fg = require('fast-glob');

        const files = await fg(['**/*.__*__.*'], { onlyFiles: true, dot: true });        
        files
          .forEach(file => {
            if(file.match(/__MERGE__/)) return
            renameSync(file, file.replace(/__.+__/g, m => substitutions[m]));
          });        
    });
}
exports.copy = copy;
