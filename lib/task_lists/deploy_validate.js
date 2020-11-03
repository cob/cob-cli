require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { checkInMaster, checkWorkingCopyCleanliness, testEquality } = require("./helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")


function validateDeployConditions(server, args) {
    console.log("\nChecking conditions to deploy to", server.bold.blue, "..." );

    return new Listr([
        {   title: "Update with origin: git fetch origin",                             task: () => git().fetch()   },
        {   title: "Check git status",                                                 task: () => checkWorkingCopyCleanliness() }, 
        {   title: "git checkout latest tag",                  skip: () => args.force, task: () => git().checkoutLatestTag() }, 
        {   title: "Check latest tag == server copy",          skip: () => args.force, task: () => testEquality(server, "localCopy", "serverCopy").catch( err => { git().checkout('master'); throw err}) },
        {   title: "git checkout master",                      skip: () => args.force, task: () => git().checkout('master') }, 
        {   title: "Check server copy == live files",          skip: () => args.force, task: () => testEquality(server, "serverCopy", "serverLive") },
        {   title: "Check there're no 'cob-cli test' running", skip: () => args.force, task: () => checkNoTestsRunningOnServer(server) },
    ])
}

exports.validateDeployConditions = validateDeployConditions;