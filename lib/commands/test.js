require('colors');
const opn = require('opn');
const { getKeypress, getServerName, getServer } = require("../task_lists/helpers");
const { customUIsContinuosReload } = require("../task_lists/test_customUIsContinuosReload");
const { otherFilesContiousReload } = require("../task_lists/test_otherFilesContiousReload");

async function test () {
    const servername = getServerName()
    const server = getServer(servername)
    
    if( servername ) {
        console.log("Start testing… ")

        customUIsContinuosReload(server)
        otherFilesContiousReload()
        
        console.log( (" NOTE: Press " + "O".bold.red + " to open default browser, any other key " + "(except enter)".red + " to stop the tests... ").bgYellow.bold + "\n\n" )
        while( await getKeypress() == "o" ) opn("http://localhost:8040/recordm/index.html")

        console.log("\nPut back files changed on server: ...");

        console.log("\nDone".green, "\nIf everything is ok you can now run:");
        console.log("\tcob-cli deploy\n")
        process.exit()
    }
};
module.exports = test;