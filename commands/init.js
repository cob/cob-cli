const colors = require('colors');
const { newProject } = require("../tasks/init_newProject");
const { legacyProject } = require("../tasks/init_legacyProject");
const { existingProject } = require("../tasks/init_existingProject");

/* ************************************************************************ */

module.exports = function(server) {
    if( projectPathOkFor(server) && notInsideGitRepo() && validCobServer(server)) {

        console.log("\nInitiating", colors.blue(colors.bold("server_"+server)) , "configurations:" );
        
        let tasks;
        if( projectExistsInGitlab(server) ) {
            tasks = existingProject(server);

        } else if( projectExistsInClientconfs(server) ) {
            tasks = legacyProject(server);

        } else {
            tasks = newProject(server)

        }
        
        tasks.run().catch(err => {
            console.error("Initialization of",  colors.blue(colors.bold("server_"+server)) ,"aborted:\n",err.message);
        })
    }  
}

/* ************************************************************************ */

function projectPathOkFor(server) {
    let result = true;

    if(result) return true
    console.log(colors.red("\nError:"),"path", colors.blue(colors.bold("./server_"+server)) ,"already exists.\n" );
}

function notInsideGitRepo() {
    let result = true;

    if(result) return true
    console.log(colors.red("\nError:"),"current directory is already part of a repostitory.\n");
}

function validCobServer(server) {
    let result = true;

    if(result) return true
    console.log(colors.red("\nError:"),colors.blue(colors.bold(server+".cultofbits.com")), "is not a valid CoB server.\n");
}

/* ************************************************************************ */

function projectExistsInGitlab(server) {
    let result = false;

    return result;
}

function projectExistsInClientconfs(server) {
    let result = false;

    return result;
}

/* ************************************************************************ */