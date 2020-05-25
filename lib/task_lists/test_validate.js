require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { testEquality } = require("./helpers");


function validateTasksForTesting(server) {
    console.log("\nChecking conditions to test", server.bold.blue, "..." );
    return new Listr([
        {   title: "git stash --include-untracked",                                    task: ()    => git().stash(["--all"]) }, 
        {   title: "git checkout latest tag",                                          task: ()    => git().checkoutLatestTag() }, 
        {   title: "Check latest tag == server copy",                                  task: ()    => testEquality(server, "localMaster", "productionMaster") },
        {   title: "git checkout -",                                                   task: (ctx) => git().checkout("-") }, 
        {   title: "git stash pop",                                                    task: ()    => git().stash(["pop","--quiet"]) }, 
    ])
}
exports.validateTasksForTesting = validateTasksForTesting;