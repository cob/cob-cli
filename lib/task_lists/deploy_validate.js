require('colors');
const Listr = require('listr');
const execa = require('execa');
const git = require('simple-git/promise');
const { cobProducts, syncFilesTasks } = require("./helpers");


function validateTasks(server, args) {
    console.log("\nDeploying to", server.bold.blue );

    return new Listr([
        {   title: "Check we're on branch 'master'",                                   task: () => checkInMaster() }, 
        {   title: "Check master cleanliness",                                         task: () => checkBranchCleanliness("master") }, 
        {   title: "git checkout latest tag",                 skip: () => args.force,  task: () => git().checkoutLatestTag() }, 
        {   title: "Check latest tag == server copy",         skip: () => args.force,  task: () => syncFilesTasks(server, "localMaster", "productionMaster", syncFilesTasks.TEST) },
        {   title: "git checkout master",                     skip: () => args.force,  task: () => git().checkout('master') }, 
        {   title: "Check server copy == production files",   skip: () => args.force,  task: () => checkLiveEqualsDeployed(server) }
    ]);
}

exports.validateTasks = validateTasks;

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

function checkBranchCleanliness(branch) {
    let tasks = [
        {   
            title: "git checkout " + branch,                                          
            task: () => git().checkout(branch)                  
        },
        {   
            title: "Update with origin: git fetch origin",                                          
            task: () => git().fetch()                  
        },
        {
            title: 'Check status: git status' ,
            task: () => 
                git()
                .status()
                .then(result => {
                    // resultSample = {"not_added":[".server"],"conflicted":[],"created":[],"deleted":[],"modified":["a.js"],"renamed":[],"files":[{"path":"a.js","index":" ","working_dir":"M"},{"path":".server","index":"?","working_dir":"?"}],"staged":[],"ahead":0,"behind":0,"current":"test","tracking":"origin/test"}                             
                    if (!result.isClean() || result.behind) {
                        let errors = ["Please clean your working tree prior to deploy:"];

                        if(result.behind) {
                            errors.push( "\t You're behind of origin/" + branch + " by " + result.behind + " commits")
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
    ]

   return new Listr(tasks);    
}

/* **************************************************************************************** */

function checkLiveEqualsDeployed(server) {
    let tasks = [];
    cobProducts.forEach( function(product) {
        let livePath = (product === "recordm-importer") 
                            ? "/opt/recordm-importer/"
                            : "/etc/" + product + "/";
        tasks.push( {
            title: "Test '" + product + " live' == Deployed copy of 'master'",
            task: (ctx,task) => 
                execa('ssh', [server, "colordiff -r",
                    "/opt/cob-cli.production.checkout/" + product + "/" ,
                    livePath,
                    "--exclude=db",
                    "--exclude=node_modules",
                    "--exclude=build",
                    "--exclude=uploaded",
                    "--exclude=.processed",
                    "--exclude=.failed",
                    "--exclude=recordm-importer.log*",
                    "--exclude=recordm-importer*.jar",
                    "--exclude=.git",
                    "--exclude=.DS_Store"
                ])
                .catch((err) => { 
                    if(err.stderr) {
                        task.skip('Not present')
                    } else {
                        let errors = [
                            "Production live files are different from the production copy of 'master'.",
                            " This problably means someone changed live files outside the standard deployment process.",
                            // "\t(TODO: Give options like 'cob-cli redeploy' or 'cob-cli reset-project') ",
                            " The offending files are:",
                            err.stdout.split("\n").map( line => "\t "+line).join("\n"),
                            "Error:".bgRed + " Live differs from 'master' on server"
                        ]
                        throw new Error(errors.join("\n"))
                    }
                })
        })
    })
    return new Listr(tasks, {concurrent: true});
}