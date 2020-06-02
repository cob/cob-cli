require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const execa = require('execa');
const { testEquality } = require("./helpers");
const { checkNoTestsRunningOnServer } = require("./test_otherFilesContiousReload")


function validateTasksForDeploy(server, args) {
    console.log("\nChecking conditions to deploy to", server.bold.blue, "..." );

    return new Listr([
        {   title: "Check we're on branch 'master'",                                   task: () => checkInMaster() },
        {   title: "Update with origin: git fetch origin",                             task: () => git().fetch()   },
        {   title: "Check git status",                                                 task: () => checkWorkingCopyCleanliness() }, 
        {   title: "git checkout latest tag",                  skip: () => args.force, task: () => git().checkoutLatestTag() }, 
        {   title: "Check latest tag == server copy",          skip: () => args.force, task: () => testEquality(server, "localMaster", "productionMaster").catch( err => { git().checkout('master'); throw err}) },
        {   title: "git checkout master",                      skip: () => args.force, task: () => git().checkout('master') }, 
        {   title: "Check server copy == production files",    skip: () => args.force, task: () => testEquality(server, "productionMaster", "productionLive") },
        {   title: "Check there're no 'cob-cli test' running", skip: () => args.force, task: () => checkNoTestsRunningOnServer(server) },
    ])
}

exports.validateTasksForDeploy = validateTasksForDeploy;

/* **************************************************************************************** */

function checkInMaster() {
    return git()
    .revparse(["--abbrev-ref","HEAD"])
    .then( result => {
        if(result != "master") {
            let errors = [
                "You're currently not in 'master' branch. Deploy must be made from 'master''.",
                "\t Do " + "git checkout master".brightBlue + " before running this command.",
                "\t If you made changes in another branch merge those changes to master ",
                "Error:".bgRed + " You must deploy from 'master'."
            ];                                
            throw new Error(errors.join("\n"))
        }
    })
}

/* **************************************************************************************** */

async function checkWorkingCopyCleanliness() {
    await git().status()
    .then(result => {
        // resultSample = {"not_added":[".server"],"conflicted":[],"created":[],"deleted":[],"modified":["a.js"],"renamed":[],"files":[{"path":"a.js","index":" ","working_dir":"M"},{"path":".server","index":"?","working_dir":"?"}],"staged":[],"ahead":0,"behind":0,"current":"test","tracking":"origin/test"}                             
        if (!result.isClean() || result.behind) {
            let errors = ["Please clean your working tree prior to deploy:"];

            if(result.behind) {
                errors.push( "\t You're behind of origin on this branch by " + result.behind + " commits")
                errors.push( "\t Consider doing a " + "git pull".brightBlue)
            }
            if(result.files.length) {
                errors.push(" Commit or stash your changes:");
                result.files.forEach( file => {
                    errors.push( "\t " + file.working_dir + " " + file.index + " " + file.path )
                })
            }
            errors.push("Error:".bgRed + " Unclean working tree")
            throw new Error(errors.join("\n"))
        }
    })
}