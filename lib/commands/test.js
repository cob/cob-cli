const execa = require('execa');
const path = require('path');

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
                            "http://localhost:8040/recordm"
                        ])
    subprocess.stdout.pipe(process.stdout)
};
module.exports = test;
