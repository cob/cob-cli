const Listr = require('listr');
const git = require('simple-git/promise');
const { copyFiles } = require("./helpers");


function resyncTasks(server,args) {
    console.log("\nResynching ...")
    return new Listr([
        { title: "Get files from server's live directories",                        task: () => copyFiles(server, "productionLive", "localMaster")   },
        { title: "Deploy files to server's copy of 'master'",                       task: () => copyFiles(server, "localMaster", "productionMaster") },
        { title: "git add .",                                                       task: () => git().add(".")                                                                  },
        { title: "git commit -m ´chore: resync configuration - ´" +args.resync ,    task: () => git().commit("chore: resync configuration - " + args.resync)                    },
        { title: "git push origin",                                                 task: () => git().push("origin","master",{"--set-upstream": null})                          },
]);
}

exports.resyncTasks = resyncTasks;

/* **************************************************************************************** */