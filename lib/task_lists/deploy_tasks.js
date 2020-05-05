const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');
const inquirer = require('inquirer');
const VerboseRenderer = require('listr-verbose-renderer');


function deployTasks(serverName, args) { //TODO: options: staging OR production
    const projectName = "server_"+serverName;
    const server = serverName+".cultofbits.com"

    console.log("\nDeploying to ", colors.blue(colors.bold(server)) );

    return new Listr([
        {   title: "Check we're in a branch",                            task: () => liveEqualsMaster(server)                                                        }, // caso contrário avisar que o comando deve ser dado no branch a colocar em produção
        {   title: "Check master is updated",                            task: () => liveEqualsMaster(server)                                                        }, // caso contrário indicar que é necessário fazer git pull
        {   title: "Check everything is commited",                       task: () => liveEqualsMaster(server)                                                        }, // caso contrário indicar que não está limpo
        {   title: "Check production.checkout.version == local.version", task: () => liveEqualsMaster(server)                                                        }, // caso contrário indicar que há versões no master que não foram deployed (ou vice-versa)
        {   title: "Check production.checkout == live",                  task: () => liveEqualsMaster(server)                                                        }, // caso contrário alguém alterou o servidor fora do processo de gestão de alterações ==> resync

        // confirmar que os testes foram feitos (via staging)
        // indicar alterações (commits) e sugerir um git rebase -n x para criar um único commit no master com a descrição da funcionalidade a fazer deploy (se sim fazer git rebase)
        // merge branch para master 
        // git checkout master
        // putFiles(production-checkout)
        // putFiles(production-live)
            
        {   
            title: "Questions: ",                                     task: () => inquirer.prompt([    
                                                                                    { type: 'confirm', name: 'decaf', message: 'Do you prefer your coffee to be decaf?', default: false },
                                                                                    { type: 'confirm', name: 'cold', message: 'Do you prefer your coffee to be cold?', default: false }
                                                                                  ]).then(function (answers) { console.log(answers) })
        }

    ],{
        renderer: VerboseRenderer
    });
}

exports.deployTasks = deployTasks;

/* **************************************************************************************** */