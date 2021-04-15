const ncp = require('ncp');
const path = require('path');
var fs = require('fs');

// https://www.npmtrends.com/copyfiles-vs-cpx-vs-ncp-vs-npm-build-tools
// https://www.npmjs.com/package/ncp
// https://www.npmjs.com/package/copyfiles

function copy(source, target) {
    if ( fs.existsSync( target ) ) {
        return "Target exists"
    }

    console.log("\nCopying...")
    return new Promise(resolve => {
        // Source is on cob-cli repo and Destination on the server repo
        ncp(path.resolve(__dirname,source) , target, { clobber: false, filter: (src) => src.match(/node_modules/) == null }, (error) => {
            if (error) {
                // Error is an array of problems
                resolve(error.map(e => e.message).join("\n"));
            } else {
                resolve();
            }
        });
    });
}
exports.copy = copy;
