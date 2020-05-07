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

    console.log("\nDeploying to ", colors.blue(colors.bold(server)) );

    return new Listr([
        {   title: "Check branch conditions",                            task: () => checkBranch()                  }, 
        {   title: "Checkout master",                                    task: () => git().checkout("master")       }, 
        {   title: "Check production.checkout == live",                  task: () => liveEqualsDeployed(server)     }, // caso contrário alguém alterou o servidor fora do processo de gestão de alterações ==> resync
        {   title: "Check production.checkout == local/master",          task: () => deployedEqualsMaster(server)   }, // caso contrário indicar que há versões no master que não foram deployed (ou vice-versa)

        
        // {   title: "Check that staging was done",                        task: () => liveEqualsMaster(server)       }, 
        // {   title: "Display changes and propose rebase",                 task: () => liveEqualsMaster(server)       }, // para criar um único commit no master com a descrição da funcionalidade a fazer deploy (se sim fazer git rebase)
        // {   title: "git rebase",                                         task: () => git().rebase() },

        // {   title: "git rev-parse master > .last_deploy ",                                      task: () => git().revparse(["master"]).then( (hash) => fs.writeFile('.last_deploy', hash) ) },
        // {   title: "git add .",                                                                 task: () => git().add(".")                                                                  },
        // {   title: "Merge branch to  master",                            task: () => liveEqualsMaster(server)       }, 
        // {   title: "git checkout master",                                task: () => liveEqualsMaster(server)       }, 
        // {   title: "Put files in production",                            task: () => liveEqualsMaster(server)       }, 
        // {   title: "Put files live",                                     task: () => liveEqualsMaster(server)       }, 
            
        // {   
        //     title: "Questions: ",                                        task: () => inquirer.prompt([    
        //                                                                                 { type: 'confirm', name: 'decaf', message: 'Do you prefer your coffee to be decaf?', default: false },
        //                                                                                 { type: 'confirm', name: 'cold', message: 'Do you prefer your coffee to be cold?', default: false }
        //                                                                              ]).then(function (answers) { console.log(answers) })
        // }

    ],{
        //renderer: VerboseRenderer,
        collapse: false
    });
}

exports.deployTasks = deployTasks;

/* **************************************************************************************** */

function checkBranch() {

    //git rev-parse --abbrev-ref HEAD

    let tasks = [
        {   
            title: "git fetch",                                          
            task: () => git().fetch()                  
        },
        {
            title: 'Checking git status',
            task: () => git().status().then(result => {
                // resultSample = {"not_added":[".server"],"conflicted":[],"created":[],"deleted":[],"modified":["a.js"],"renamed":[],"files":[{"path":"a.js","index":" ","working_dir":"M"},{"path":".server","index":"?","working_dir":"?"}],"staged":[],"ahead":0,"behind":0,"current":"test","tracking":"origin/test"}                
                if(result.tracking == "origin/master") {
                    let error = ["Deploy must be made from a branch.",
                                 "\tIf you made changes directly to 'master' consider https://stackoverflow.com/questions/3899627/create-git-branch-with-current-changes'"];
                    
                    // TODO: Just list branchs and show command to checkout branch OR propose an existing branch and checkout OR propose creating branch with changes
                    throw new Error(error.join("\n") + '\n ' + colors.red("\n Error:") + ' You must deploy from a branch.');
                }                
                if (!result.isClean()) {
                    let unclean = ["Please clean your working tree prior to deploy:"];

                    if(result.behind) {
                        unclean.push( "\t Behind origin: " +result[key])
                    }
                    if(result.ahead) {
                        unclean.push( "\t Ahead origin: " +result[key])
                    }
                    if(result.files.length) {
                        unclean.push("    Commit or stash your changes:");
                        result.files.forEach( file => {
                            unclean.push( "\t" + file.working_dir + " " + file.index + " " + file.path )
                        })
                    }

                    throw new Error(unclean.join("\n") + colors.red("\n Error:") + ' Unclean working tree');
                }
            })
        }
    ]

   return new Listr(tasks);    
    // {   title: "Check if rebase is necessary",                       task: () => liveEqualsMaster(server)       }, // caso contrário indicar que não está limpo
}

/* **************************************************************************************** */

async function liveEqualsDeployed(server) {
    let tasks = [];
    let products = ["recordm","integrationm","userm","devicem","recordm-importer","logm"]
    products.forEach( function(product) {
        let serverPath = (product === "recordm-importer") 
                            ? "/opt/recordm-importer/"
                            : "/etc/" + product + "/";
        tasks.push( {
            title: "Test '" + product + " live' Equals Deployed",
            task: (ctx,task) => execa('ssh', [server, "colordiff -r",
                                    "/opt/cob-cli.production.checkout/" + product + "/" ,
                                    serverPath,
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
                                    let result = err.stderr.split("\n")

                                    if(err.stderr) task.skip('Not present') 
                                    else throw(new Error(err.stdout + "\nTODO: Live != deploy. Your options: 'cob-cli redeploy' or 'cob-cli reset-project'"))
                                })
        })
    })
    return new Listr(tasks, {concurrent: true});
}


function deployedEqualsMaster(server) { 
    let products = ["recordm","integrationm","userm","devicem","recordm-importer","logm"]
    let serverPath = "/opt/cob-cli.production.checkout/"
    let tasks = [ {
        title: "Test deployed Equals Master ",
        task: () => execa('rsync', [
                path.resolve(".")+"/",
                server + ":" + serverPath,
                "--dry-run",
                "-aczv",
                "--delete",
                "--exclude=.git",
                "--exclude=.DS_Store"
            ])
            .then( (value) => {
                let result = value.stdout
                            .split("\n")
                            .slice(1,-3)
                            .filter( line => !line.endsWith("/"))
                            .map( line => {
                                if( line.startsWith("deleting")) return line.replace("deleting","removed") 
                                return "added/changed " + line 
                            })
                            .join("\n\t")
                throw(new Error("Local master has:\n\t" + result + "\nDeployed checkout is different from local/master checkout"))
            })
    // },
    // {
    //     title: "Check result",
    //     task: (ctx, task) => console.log(ctx.result)
    }];
    return new Listr(tasks);
}

