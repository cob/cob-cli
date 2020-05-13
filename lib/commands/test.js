const execa = require('execa');
const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const readline = require('readline');

async function test () {
/* TODO: 
 * ve se está num branch != master
    * se sim prossegue
    * se não lista branches existentes.
 * merge para master (ff ?)
 * pergunta se quer fechar o branch.
*/
    console.log("Start testing… ")
    let subprocess = execa(path.resolve(__dirname, '../../node_modules/.bin/webpack-dev-server'), [
        "--config", 
        "../cob-cli/lib/webpack/webpack.config.js",
        "--open",
        "\"Google Chrome\"",
        "--public",
        "http://localhost:8040/recordm",
        "--env.SERVER=" + getServerName() + ".cultofbits.com"
    ])
    subprocess.stdout.pipe(process.stdout)

    await getAnswer(" NOTE: Press any key to stop the tests...".bgYellow.bold + "\n\n")

    subprocess.cancel();
    console.log("\nDone".green, "\nIf everything is ok you can now run:");
    console.log("\tcob-cli deploy\n")
};
module.exports = test;

/* *************************** PRE EXECUTION VALIDATIONS ********************************** */

function getServerName() {
    try {
        var data = fs.readFileSync('.server', 'utf8');
        return data;    
    } catch(e) {
        console.log("Error:".red,"´.server´ not found. `test` should be run inside project directory.\n" );
    }
        
}

function getAnswer(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(question, ans => {
        rl.close();
        resolve(ans);
    }))
}