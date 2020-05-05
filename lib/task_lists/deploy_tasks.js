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
        {   title: "Check production.checkout.version == local.version", task: () => liveEqualsMaster(server)       }, // caso contrário indicar que há versões no master que não foram deployed (ou vice-versa)
        {   title: "Check production.checkout == live",                  task: () => liveEqualsMaster(server)       }, // caso contrário alguém alterou o servidor fora do processo de gestão de alterações ==> resync
        

        {   title: "Check that staging was done",                        task: () => liveEqualsMaster(server)       }, 
        {   title: "Display changes and propose rebase",                 task: () => liveEqualsMaster(server)       }, // para criar um único commit no master com a descrição da funcionalidade a fazer deploy (se sim fazer git rebase)
        {   title: "Merge branch to  master",                            task: () => liveEqualsMaster(server)       }, 
        {   title: "git checkout master",                                task: () => liveEqualsMaster(server)       }, 
        {   title: "Put files in production",                            task: () => liveEqualsMaster(server)       }, 
        {   title: "Put files live",                                     task: () => liveEqualsMaster(server)       }, 
            
        {   
            title: "Questions: ",                                        task: () => inquirer.prompt([    
                                                                                        { type: 'confirm', name: 'decaf', message: 'Do you prefer your coffee to be decaf?', default: false },
                                                                                        { type: 'confirm', name: 'cold', message: 'Do you prefer your coffee to be cold?', default: false }
                                                                                     ]).then(function (answers) { console.log(answers) })
        }

    ],{
        // renderer: VerboseRenderer
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
        {   title: "Check we're on a branch - git rev-parse --abbrev-ref HEAD ",
            task: () => git().revparse(["--abbrev-rev HEAD]"])
                        .then( (branch) => {
                            if(branch == "master") {
                                throw new Error('You must deploy from a branch. Consider https://stackoverflow.com/questions/3899627/create-git-branch-with-current-changes');
                            }
                        }) 
        },
        {
            title: 'Checking git status - git status --porcelain',
            task: () => git().status().then(result => {
                // resultSample = {"not_added":[".server"],"conflicted":[],"created":[],"deleted":[],"modified":["a.js"],"renamed":[],"files":[{"path":"a.js","index":" ","working_dir":"M"},{"path":".server","index":"?","working_dir":"?"}],"staged":[],"ahead":0,"behind":0,"current":"test","tracking":"origin/test"}                
                if (!result.isClean()) {
                    throw new Error('Unclean working tree. Commit or stash changes first: '+JSON.stringify(result));
                }
            })
        }
    ]

   return new Listr(tasks);    
    // caso contrário avisar que o comando deve ser dado no branch a colocar em produção
    // {   title: "Check master is updated",                            task: () => liveEqualsMaster(server)       }, // caso contrário indicar que é necessário fazer git pull
    // {   title: "Check everything is commited",                       task: () => liveEqualsMaster(server)       }, // caso contrário indicar que não está limpo
    // {   title: "Check if rebase is necessary",                       task: () => liveEqualsMaster(server)       }, // caso contrário indicar que não está limpo
}