require('colors');
const { getDiffs, getKeypress } = require("./helpers");

async function showDiffs(server, args) {
    console.log("\nThese are the files to be deployed...")
    if(await getDiffs(server)) {
        console.log(" Continue? [y/N] ".bgYellow.bold + " ")
        let answer = await getKeypress()
        if(answer != "y") {
            throw new Error("Error:".red + " Aborted by user\n" );    
        }
    } else {
        throw new Error("Canceled:".yellow + " nothing todo\n")
    }
}

exports.showDiffs = showDiffs;