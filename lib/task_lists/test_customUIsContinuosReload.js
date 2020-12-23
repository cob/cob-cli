const execa = require('execa');
const path = require('path');
const concurrently = require('concurrently');
const fs= require('fs');

function customUIsContinuosReload(server, dashboard) {
    process.env.dash_dir = dashboard
    process.env.server = "https://" + server

    let commands = []

    let dashboardPath = path.resolve(".") + "/recordm/customUI/" + dashboard;
    let dashboardPathIsDirectory = false;
    try {
        dashboardPathIsDirectory = dashboard && fs.lstatSync(dashboardPath).isDirectory()
    } catch {
        throw new Error("Aborted: ".red + " dashboard " + dashboard.bold + " does not exist.\n  ")
    }

    if(dashboardPathIsDirectory) {
        commands.push( {
            command: [
                "cd " + dashboardPath + ";",
                "npm install;",
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
    }).catch( err => { 
        console.log("press any key " + "(except enter)".red + " to stop the tests... \n  ")
        process.kill(process.pid, "SIGINT");
    })
}
exports.customUIsContinuosReload = customUIsContinuosReload;