const execa = require('execa');
const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');

function test () {
/* TODO: 
 * ve se está num branch != master
    * se sim prossegue
    * se não lista branches existentes.
 * merge para master (ff ?)
 * pergunta se quer fechar o branch.
*/
    console.log("Start testing! After, if everything is ok, you can run:")
    console.log("\tcob-cli deploy\n")
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
};
module.exports = test;

/* *************************** PRE EXECUTION VALIDATIONS ********************************** */

function getServerName() {
    try {
        var data = fs.readFileSync('.server', 'utf8');
        return data;    
    } catch(e) {
        console.log(colors.red("\nError:"),"´.server´ not found. `test` should be run inside project directory.\n" );
    }
        
}