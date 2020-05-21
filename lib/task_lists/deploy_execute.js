const Listr = require('listr');
const git = require('simple-git/promise');
const { syncFilesTasks, cobSemanticRelease} = require("./helpers");


function executeTasks(server) {
    console.log("\nDeploying ...")
    return new Listr([
        { title: "semantic-release -e deploy_semanticReleaseConfiguration --no-ci", task: () => cobSemanticRelease()                                                           },
        { title: "git push origin master",                                          task: () => git().push()                                                                   }, 
        { title: "Deploy files to server's copy of 'master'",                       task: () => syncFilesTasks(server, "localMaster", "productionMaster", syncFilesTasks.COPY) }, 
        { title: "Deploy files to server's live directories",                       task: () => syncFilesTasks(server, "localMaster", "productionLive", syncFilesTasks.COPY)   }       
    ]);
}

exports.executeTasks = executeTasks;

/* **************************************************************************************** */