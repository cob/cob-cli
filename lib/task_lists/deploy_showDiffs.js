require('colors');
const { diffFiles, getKeypress } = require("./helpers");

async function showDiffs(server, args) {
    console.log("\nChecking changes...")
    
    let changes = await diffFiles(server, "localMaster", "productionLive")
    if(changes.length) {
        console.log("This deploy will:")
        console.log(" " + changes.join("\n "))
        console.log("\n" + " Continue? [y/N] ".bgYellow.bold + " ")
        
        let answer = await getKeypress()
        if(answer != "y") {
            throw new Error("Error:".red + " Aborted by user\n" );    
        }
    } else {
        throw new Error("Canceled:".yellow + " nothing todo\n")
    }
}

exports.showDiffs = showDiffs;