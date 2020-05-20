const colors = require('colors');
const execa = require('execa');
const path = require('path');
const readline = require('readline');



async function showDiffs(serverName, args) {
    const server = serverName+".cultofbits.com"

    console.log("These are the files to be deployed...")
    let changeCount = await getDiffs(server)
    if(changeCount) {
        let answer = await getAnswer(" Continue? [y/N]".bgYellow.bold + "\n")
        if(answer != "y" && answer != "Y") {
            throw ("Error:".red + " Aborted by user\n" );    
        }
    } else {
        throw ("Error:".red + " Nothing todo\n" );    
    }
    
}

exports.showDiffs = showDiffs;

/* ************************************ */
async function getDiffs(server) {

    /* **************** */
    function _resolvePath(server, type, product) {
        switch (type) {
            case "localMaster":
                return path.resolve(".") + "/" + product + "/";

            case "productionMaster":
                return server + ":/opt/cob-cli.production.checkout/" + product + "/";

            case "productionDefault":
                return server + ":/opt/" + product + "/etc.default/";
                
            case "productionLive":
                return server + ":"
                    + ((product == "recordm-importer")
                        ? "/opt/recordm-importer/"
                        : "/etc/" + product + "/");
        }
    }
    /* **************** */

    let products = ["recordm", "integrationm", "recordm-importer", "logm", "userm", "devicem"];
    let from = "localMaster"
    let to = "productionLive"
    let changeCount = 0;
    for(let i= 0; i < products.length; i++) {
        let product = products[i]
        let fromPath = _resolvePath(server, from, product);
        let toPath = _resolvePath(server, to, product);
        
        console.log(" " + product + "...")
        await execa('rsync', [
            fromPath,
            toPath,
            "-aczv",
            "--delete",
            "--exclude=db",
            "--exclude=node_modules",
            "--exclude=build",
            "--exclude=uploaded",
            "--exclude=.processed",
            "--exclude=.failed",
            "--exclude=recordm-importer.log*",
            "--exclude=recordm-importer*.jar",
            "--exclude=.git",
            "--exclude=.DS_Store",
            "--dry-run"
        ])
        .then((value) => {
            let result = value.stdout
                .split("\n")
                .slice(1, -3) // Apenas as linhas com as diferenças é que interessam 
                .filter(line => !line.endsWith("/")) // diferenças nos settings das directorias tb não interessam
                .filter(line => !line.endsWith("is uptodate")) // sem diferenças tb não interessam
            if(result.length > 0) {
                result.forEach( file => {
                    changeCount++;
                    if(file.startsWith("deleting"))
                        console.log("   ",file.red)
                    else
                        console.log("   ",("add/change " + file).green)
                })
            }
        })
        .catch((err) => {
            if (err.exitCode != 12 && err.exitCode != 23)
                throw err;
        })
    };
    return changeCount
}

/* ************************************ */

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

