require('colors');
const { getDiffs, getAnswer } = require("./helpers");

async function showDiffs(server, args) {
    console.log("\nThese are the files to be deployed...")
    if(await getDiffs(server)) {
        let answer = await getAnswer(" Continue? [y/N] ".bgYellow.bold + " ")
        if(answer != "y" && answer != "Y") {
            throw ("Error:".red + " Aborted by user\n" );    
        }
    } else {
        throw ("Canceled:".yellow + " nothing todo\n" );    
    }
}

exports.showDiffs = showDiffs;