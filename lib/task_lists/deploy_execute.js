const Listr = require('listr');
const git = require('simple-git/promise');
const { copyFiles, semanticRelease } = require("./helpers");


function executeTasks(server) {
    console.log("\nDeploying ...")
    return new Listr([
        { title: "semantic-release -e deploy_semanticReleaseConfiguration --no-ci", task: () => semanticRelease()                                                    },
        { title: "git push origin master",                                          task: () => git().push()                                                         }, 
        { title: "Deploy files to server's copy of 'master'",                       task: () => copyFiles(server, "localMaster", "productionMaster") }, 
        { title: "Deploy files to server's live directories",                       task: () => copyFiles(server, "localMaster", "productionLive")   } 
    ]);
}

exports.executeTasks = executeTasks;

/* **************************************************************************************** */