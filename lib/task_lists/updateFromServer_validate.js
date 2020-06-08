require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const { checkInMaster, checkWorkingCopyCleanliness } = require("./helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")

function validateUpdateFromServerConditions(server) {
    console.log("Checking conditions to update cob-cli files from", server.bold.blue );
    return new Listr([
        {   title: "Update with origin: git fetch origin",                             task: () => git().fetch()   },
        {   title: "Check we're on branch 'master'",                                   task: () => checkInMaster() },
        {   title: "Check git status",                                                 task: () => checkWorkingCopyCleanliness() }, 
        {   title: "Check there's no cob-cli test' running",                           task: () => checkNoTestsRunningOnServer(server) },
   ])
}
exports.validateUpdateFromServerConditions = validateUpdateFromServerConditions