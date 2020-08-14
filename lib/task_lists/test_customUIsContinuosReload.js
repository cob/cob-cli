const execa = require('execa');
const path = require('path');
const concurrently = require('concurrently');

function customUIsContinuosReload(server, dashboard) {
    process.env.dash_dir = dashboard
    process.env.server = "https://" + server

    let commands = []

    if(dashboard) {
        commands.push( {
            command: [
                "cd " + path.resolve(".") + "/recordm/customUI/" + dashboard + ";",
                "node_modules/.bin/vue-cli-service serve --port 8041 2>/dev/null" 
            ].join(" "), 
            name: 'dashboard server',
            prefixColor: "red" 
        })
    }

    commands.push({
        command: [
            path.resolve(__dirname, '../../node_modules/.bin/webpack-dev-server'),
            "--config",
            path.resolve(__dirname, "../webpack/webpack.config.js"),
            "--env.SERVER=" + "https://" + server,
            "--env.DASHBOARD=" + dashboard
        ].join(" "), 
        name: 'customUI server',
        prefixColor: "blue" 
    }) 

    concurrently( commands, {
        prefix: 'name',
        inputStream: process.stdin,
        handleInput: false,
        killOthers: ['failure', 'success']
    })
}
exports.customUIsContinuosReload = customUIsContinuosReload;