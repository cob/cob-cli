require('colors');
const execa = require('execa');
const path = require('path');

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
        let subprocess = execa(path.resolve(__dirname, '../../node_modules/.bin/webpack-dev-server'), [
            "--config", 
            "../cob-cli/lib/webpack/webpack.config.js",
            "--open",
            "\"Google Chrome\"",
            "--public",
            "http://localhost:8040/recordm",
            "--env.SERVER=" + getServer(getServerName())
        ])
        subprocess.stdout.pipe(process.stdout)
    
        await getAnswer(" NOTE: Press any key to stop the tests...".bgYellow.bold + "\n\n")
    
        subprocess.cancel();
        console.log("\nDone".green, "\nIf everything is ok you can now run:");
        console.log("\tcob-cli deploy\n")
    }
};

module.exports = test;