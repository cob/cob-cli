const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');
const inquirer = require('inquirer');
const VerboseRenderer = require('listr-verbose-renderer');


function deployTasks(serverName, args) {
    const projectName = "server_"+serverName;
    const server = serverName+".cultofbits.com"

    console.log("\nDeploying to ", server.bold.blue );

    return new Listr([
        {   title: "Check we're not on 'master' <branch>",               task: () => checkNotMaster()                        }, 
        {   title: "Check branch cleanliness",                           task: (ctx) => checkBranchCleanliness(ctx.branch)   }, 
        {   title: "Check master cleanliness",                           task: () => checkBranchCleanliness("master")        }, 
        {   title: "Check local 'master' ==  server copy of 'master'",   task: () => syncFiles(server, "localMaster", "productionMaster", true)  },
        {   title: "Check server copy of 'master' == production files",  task: () => checkLiveEqualsDeployed(server)         }, 
        {   title: "git checkout <branch>",                              task: (ctx) => git().checkout(ctx.branch)           }, 
        {   title: "Check there's something to deploy",                  task: (ctx) => git().diff([ctx.branch+"..master"]).then( (val) => { if(val == "") throw new Error("Error:".bgYellow + " No change, nothing to deploy.") } )     }, 
        // {   title: "Check that staging was done",                        task: () => liveEqualsMaster(server)                }, 
        {   title: "git rebase",                                         task: () => git().rebase()                          },
        {   title: "git push origin <branch>",                           task: (ctx) => git().push(['-u', 'origin', ctx.branch]) }, 
        {   title: "git checkout master",                                task: () => git().checkout("master")                  }, 
        {   title: "git merge master",                                   task: (ctx) => git().mergeFromTo(ctx.branch,"master") },
        {   title: "git push origin master",                             task: () => git().push()         }, 
        {   title: "git rev-parse master > .last_deploy ",               task: () => git().revparse(["master"]).then( (hash) => fs.writeFile('.last_deploy', hash) ) },
        {   title: "Put server copy of 'master'",                        task: () => syncFiles(server, "localMaster", "productionMaster", false)                }, 
        {   title: "Put server live",                                    task: () => syncFiles(server, "localMaster", "productionLive", false)                   },         
        {   title: "git checkout <branch>",                              task: (ctx) => git().checkout(ctx.branch)           }, 
    ],{
        // renderer: VerboseRenderer,
        collapse: true
    });
}

exports.deployTasks = deployTasks;

/* **************************************************************************************** */

function checkNotMaster() {

    let tasks = [
        {   
            title: "Get current branch: git rev-parse --abbrev-ref HEAD ",                                          
            task: (ctx) => 
                git().revparse(["--abbrev-ref","HEAD"])
                .then( result => {
                    if(result == "master") {
                        let errors = [
                            "You're currently in 'master' branch. Deploy must be made from a branch.",
                            "\t Do " + "git checkout <branch to deploy>".brightBlue + " before running this command.",
                            "\t Do " + "git branch".brightBlue + " to see available branches.",
                            "\t If you made changes directly to 'master' consider " + "https://stackoverflow.com/questions/3899627/create-git-branch-with-current-changes".underline.brightBlue,
                            //"\t(TODO: Consider list branchs and checkout selected OR create branch with changes)",
                            "Error:".bgRed + " You must deploy from a branch."
                        ];                                
                        throw new Error(errors.join("\n"))
                    }
                    ctx.branch = result
                })
        }
    ]

   return new Listr(tasks);    
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
            task: (ctx) => 
                git().status()
                .then(result => {
                    // resultSample = {"not_added":[".server"],"conflicted":[],"created":[],"deleted":[],"modified":["a.js"],"renamed":[],"files":[{"path":"a.js","index":" ","working_dir":"M"},{"path":".server","index":"?","working_dir":"?"}],"staged":[],"ahead":0,"behind":0,"current":"test","tracking":"origin/test"}                             
                    if (!result.isClean() || result.behind) {
                        let errors = ["Please clean your working tree prior to deploy:"];

                        if(result.behind) {
                            errors.push( "\t You're behind of origin/" + branch + " by " + result.behind + " commits")
                            if(branch == "master") {
                                errors.push( "\t Consider doing a " + ("git checkout master; git pull; git checkout " + ctx.branch + "; git rebase master").brightBlue)
                            } else { 
                                if(branch != "master") errors.push( "\t Consider doing a " + ("git pull").brightBlue)
                            }
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
    let products = ["recordm","integrationm","recordm-importer","logm","userm","devicem"]
    products.forEach( function(product) {
        let livePath = (product === "recordm-importer") 
                            ? "/opt/recordm-importer/"
                            : "/etc/" + product + "/";
        tasks.push( {
            title: "Test '" + product + " live' == Deployed copy of 'master'",
            task: (ctx,task) => 
                execa('ssh', [server, "colordiff -r",
                    "/opt/cob-cli.production.checkout/" + product + "/" ,
                    livePath,
                    "-x db",
                    "-x node_modules",
                    "-x build",
                    "-x uploaded",
                    "-x .processed",
                    "-x .failed",
                    "-x recordm-importer.log*",
                    "-x recordm-importer*.jar"
                ])
                .catch((err) => { 
                    if(err.stderr) {
                        task.skip('Not present')
                    } else {
                        git().checkout(ctx.branch); // get back to original branch
                        let errors = [
                            "Production live files are different from the production copy of 'master'.",
                            " This problably means someone changed live files outside the standard deployment process.",
                            // "\t(TODO: Give options like 'cob-cli redeploy' or 'cob-cli reset-project') ",
                            " The offending files are:",
                            err.stdout.split("\n").map( line => "\t "+line).join("\n"),
                            "Error:".bgRed + " Live differs from 'master'"
                        ]
                        throw new Error(errors.join("\n"))
                    }
                })
        })
    })
    return new Listr(tasks, {concurrent: true});
}

/* ************************************ */

function syncFiles(server,from,to, testEqualityOnly) { // { from & to } can be: [ localMaster | productionMaster | productionLive | productionDefault ]

    /* **************** */
    function _resolvePath(server,type,product) {

        if(type == "localMaster") {
            return path.resolve(".")+"/"+product+"/"
        }
        if(type == "productionMaster") {
            return server + ":/opt/cob-cli.production.checkout/" + product + "/"
        }
        if(type == "productionDefault") {
            return server +  ":/opt/" + product + "/etc.default/"
        }
        if(type == "productionLive") {
            return server +  ":" 
                   + ((product == "recordm-importer") 
                        ? "/opt/recordm-importer/"
                        : "/etc/" + product + "/")
        }
    }
    /* **************** */

    let tasks = [];
    let products = ["recordm","integrationm","recordm-importer","logm","userm","devicem"]
    products.forEach( function(product) {
        let fromPath = _resolvePath(server,from,product)
        let toPath   = _resolvePath(server,to,product)
        tasks.push( {
            title: (testEqualityOnly ? "Test " : "Sync ") + product + " " + from + (testEqualityOnly ? " == " : " to ") + to,
            task: (ctx, task) => execa('rsync', [
                    fromPath,
                    toPath,
                    "-aczv",
                    "--delete",
                    "--exclude=db",
                    "--exclude=node_modules",
                    "--exclude=build",
                    "--exclude=uploaded",
                    "--exclude=.processed",
                    "--exclude=.failed",
                    "--exclude=recordm-importer.log*",
                    "--exclude=recordm-importer*.jar",
                    "--exclude=.git",
                    "--exclude=.DS_Store",
                    testEqualityOnly ? "--dry-run" : "-v"
                ])
            .then( (value) => {
                let result = value.stdout
                            .split("\n")
                            .slice(1,-3)                            // Apenas as linhas com as diferenças é que interessam 
                            .filter( line => !line.endsWith("/"))   // diferenças nos settings das directorias tb não interessam
                            .map( line => {                         // mudar para mensagem mais contextualizada
                                if( line.startsWith("deleting")) {
                                    return line.replace("deleting","removed")
                                } else {
                                    return "added/changed " + line 
                                }
                            })
                if (testEqualityOnly && result != "") {
                    git().checkout(ctx.branch);     // get back to original branch
                    let errors = [ 
                        "Compared to the production copy of '" + product + "/master', local checkout has:",
                        result.map( line => "\t "+line).join("\n"),
                        "\n Either some version(s) of master where not deployed or your copy of master is not updated",
                        " You have 2 options: either choose the server version or the local version. ",
                        // "\t (TODO: Give options like 'cob-cli redeploy' or 'cob-cli reset-project')",
                        "Error:".bgRed + " Deployed checkout is different from local/master checkout"
                    ]
                    throw new Error(errors.join("\n"))
                }
            })
            .catch((err) => { 
                if(err.exitCode == 12 || err.exitCode == 23) task.skip('Not present') 
                else throw err
            })
        })
    })
    return new Listr(tasks, {concurrent: true});
}
