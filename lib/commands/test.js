require('colors');
const execa = require('execa');
const path = require('path');
const fs = require('fs-extra');
var opn = require('opn');

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
            "--env.SERVER=" + getServer(getServerName())
        ])
        webpack.stdout.pipe(process.stdout)


        while( await getAnswer((" NOTE: Press " + "o".bold.red + " to open default browser, any other key to stop the tests... ").bgYellow.bold + "\n\n") == "o" ) {
            // opens the url in the default browser 
            opn("http://localhost:8040/recordm/index.html");
         }
        
    
        webpack.cancel();
        watcher.close();
        console.log("\nDone".green, "\nIf everything is ok you can now run:");
        console.log("\tcob-cli deploy\n")
        process.exit()
    }
};

module.exports = test;