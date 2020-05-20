const Listr = require('listr');
const fs = require('fs-extra');
const git = require('simple-git/promise');
const { syncFiles } = require("./syncFiles");
const path = require('path');
const execa = require('execa');


function executeTasks(serverName) {
    const server = serverName+".cultofbits.com"

    return new Listr([
        {   title: "semantic-release -e deploy_semanticReleaseConfiguration --no-ci",                            
            task: () => execa("node",[
                            path.resolve(__dirname, '../../node_modules/semantic-release/bin/semantic-release.js'),
                            "-e",path.resolve(__dirname, 'deploy_semanticReleaseConfiguration.js'),
                            "--no-ci"]
                        )
        },
        {   title: "git push origin master",                      task: () => git().push() }, 
        {   title: "Deploy files to server's copy of 'master'",   task: () => syncFiles(server, "localMaster", "productionMaster", syncFiles.COPY) }, 
        {   title: "Deploy files to server's live directories",   task: () => syncFiles(server, "localMaster", "productionLive", syncFiles.COPY) }       
    ]);
}

exports.executeTasks = executeTasks;

/* **************************************************************************************** */