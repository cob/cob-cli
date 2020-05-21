require('colors');
const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');

const { getAnswer, getServerName, getServer } = require("../task_lists/helpers");

/* TODO: 
* ve se está num branch != master
* se sim prossegue
* se não lista branches existentes.
* merge para master (ff ?)
* pergunta se quer fechar o branch.
*/
async function test () {
    const servername = getServerName()

    if( servername ) {
        const server = getServer(servername)
        console.log("Start testing… ")

        let watcher = fs.watch('.', {recursive: true}, (eventType, filename) => {
            if (filename && filename.indexOf("m/customUI") < 0) {
                process.stdout.write(`Sync ${filename} to production\n`);
                if(filename.indexOf("integrationm/scripts") < 0 
                    && filename.indexOf("integrationm/actions") < 0 
                    && filename.indexOf("integrationm/commons") < 0) {
                        process.stdout.write(`Attention: this sync requires a restart\n`);                            
                }
            }
        })

        let webpack = execa(path.resolve(__dirname, '../../node_modules/.bin/webpack-dev-server'), [
            "--config", 
            "../cob-cli/lib/webpack/webpack.config.js",
            "--open",
            "\"Google Chrome\"",
            "--public",
            "http://localhost:8040/recordm",
            "--env.SERVER=" + getServer(getServerName())
        ])
        webpack.stdout.pipe(process.stdout)

        await getAnswer(" NOTE: Press any key to stop the tests...".bgYellow.bold + "\n\n")
    
        webpack.cancel();
        watcher.close();
        console.log("\nDone".green, "\nIf everything is ok you can now run:");
        console.log("\tcob-cli deploy\n")
    }
};

module.exports = test;