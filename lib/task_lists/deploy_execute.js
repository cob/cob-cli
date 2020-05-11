const Listr = require('listr');
const fs = require('fs-extra');
const git = require('simple-git/promise');
const { syncFiles } = require("./syncFiles");


function executeTasks(serverName) {
    const server = serverName+".cultofbits.com"

    return new Listr([
        {   title: "git push origin master",                                                      task: () => git().push() }, 
        {   title: "git rev-parse master > .last_deploy ",                                        task: () => git().revparse(["master"]).then( (hash) => fs.writeFile('.last_deploy', hash) ) },
        {   title: "Deploy files to server's copy of 'master'",                                   task: () => syncFiles(server, "localMaster", "productionMaster", false) }, 
        {   title: "Deploy files to server's live directories",                                   task: () => syncFiles(server, "localMaster", "productionLive", false) }       
    ]);
}

exports.executeTasks = executeTasks;

/* **************************************************************************************** */