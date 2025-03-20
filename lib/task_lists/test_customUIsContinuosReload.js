const execa = require('execa');
const path = require('path');
const concurrently = require('concurrently');
const fs= require('fs');
const util  = require('util');
const child_process = require('child_process');
const exec = util.promisify(child_process.exec);


async function customUIsContinuosReload(cmdEnv, dashboard) {
    process.env.dash_dir = dashboard
    process.env.server = "https://" + cmdEnv.serverHTTPs

    let commands = []
    let isStopping = false;

    let dashboardPath = path.resolve(".") + "/recordm/customUI/" + dashboard;
    let dashboardPathIsDirectory = false;
    try {
        dashboardPathIsDirectory = dashboard && fs.lstatSync(dashboardPath).isDirectory()
    } catch {
        throw new Error("Aborted: ".red + " dashboard " + dashboard.bold + " does not exist.\n  ")
    }

    if(dashboardPathIsDirectory) {
        // If we have a dashboard to serve run it from local dashboard directory on 8081 with vue-cli-service
        // it will use its vue.config.js
        console.log("\n PLEASE WAIT".red + ": checking dependencies...")
        await execa("npm",["install"],{cwd: dashboardPath} )

        commands.push( {
            command: [
                "cd " + dashboardPath + ";",
                "node_modules/.bin/vue-cli-service serve --port 8041 2>/dev/null" 
            ].join(" "), 
            name: 'dashboard server',
            prefixColor: "red" 
        })
    }

    console.log( "\n" + (" NOTE: Press " + "O".bold.red + " to open default browser, " + "CTRL+C".bold.red + " or " + "Q".bold.red + " to stop the tests... ").yellow.bold + "\n\n" )

    commands.push({
        // run wepback from cob-cli directory with webpack.config.js also from cob-cli directory
        command: [
            path.resolve(__dirname, '../../node_modules/.bin/webpack-dev-server'),
            "--config",
            path.resolve(__dirname, "../webpack/webpack.config.js"),
            "--mode=development"
        ].join(" "), 
        name: 'customUIs server',
        prefixColor: "blue" 
    }) 

    const conc = concurrently( commands, {
        prefix: 'name',
        inputStream: process.stdin,
        handleInput: false,
        killOthers: ['failure', 'success']
    });

    const stopEverything = async function(){
        isStopping = true;
        for(const spawn of conc.commands) {
            // console.log("\n killing spawn [" + spawn.pid + "] " + spawn.command )
        
            // win32 seems to not kill child processes, and concurrently wraps executions with a cmd.exe shell
            if (process.platform === 'win32') {
                try {
                    await exec(`taskkill /PID ${spawn.pid} /T /F`)
                } catch (err) {
                    console.error("error trying to taskkill process tree", err)
                }

            } else {
                spawn.kill("SIGINT");
            }
        }
    }

    conc.result.catch( _err => { 
        if(isStopping) return;

        stopEverything();
    });

    return {
        stop: stopEverything
    };
}
exports.customUIsContinuosReload = customUIsContinuosReload;
