const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');
const UpdaterRenderer = require('listr-update-renderer');
const { syncFiles } = require("./syncFiles");


function newProjectTasks(serverName, args) {
    const projectName = "server_"+serverName;
    const server = serverName+".cultofbits.com"

    console.log("\nNew project", colors.blue(colors.bold(server)) );

    return new Listr([
        {   title: "Get legacy repository",                        skip: () => !args.legacy,    task: () => init_getLegacyFiles(args.legacy, projectName)                                   },

        {   title: 'mkdir ' + projectName,                         skip: () => args.legacy,     task: () => fs.mkdirs(projectName)                                                          },
        {   title: 'cd ' + projectName,                            skip: () => args.legacy,     task: () => process.chdir(projectName)                                                      },
        {   title: 'git init',                                     skip: () => args.legacy,     task: () => git().init()                                                                    },
        {   title: "Get initial defaults",                         skip: () => args.legacy,     task: () => syncFiles(server,"productionDefault","localMaster", false)                       },
        {   title: "git add .",                                    skip: () => args.legacy,     task: () => git().add(".")                                                                  },
        {   title: "git commit -m ´Default configuration´ ",       skip: () => args.legacy,     task: () => git().commit("Default configuration")                                           },
        
        {   title: "Get current config",                                                        task: () => syncFiles(server,"productionLive","localMaster", false)                          },
        {   title: "add .gitignore",                                                            task: () => fs.copyFile(path.resolve(__dirname, '../templates/.gitignore'), '.gitignore')   },
        {   title: "add .server ",                                                              task: () => fs.writeFile('.server', serverName)                                             },
        {   title: "git add .",                                                                 task: () => git().add(".")                                                                  },
        {   title: "git commit -m ´Base configuration´ ",                                       task: () => git().commit("Base configuration")                                              },
        {   title: "git rev-parse master > .last_deploy ",                                      task: () => git().revparse(["master"]).then( (hash) => fs.writeFile('.last_deploy', hash) ) },

        {   title: 'git remote add origin ' + args.repoaccount + projectName + ".git",          task: () => git().addRemote("origin",args.repoaccount + projectName + ".git")               },
        {   title: "git push origin",                                                           task: () => git().push("origin","master",{"--set-upstream": null})                          },

        {   title: "[remote] mkdir /opt/cob-cli.production.checkout",                           task: () => execa('ssh', [server,"mkdir /opt/cob-cli.production.checkout"])                 },
        {   title: "[Remote] Put current config in production.checkout",                        task: () => syncFiles(server,"localMaster","productionMaster", false)                        },
        // {   title: "[remote] mkdir /opt/cob-cli.staging.checkout",                              task: () => execa('ssh', [server,"mkdir /opt/cob-cli.staging.checkout"])                    },
        // {   title: "[Remote] Put current config in staging.checkout",                           task: () => init_putFiles(server,"staging")                                        }
    ],{
        renderer: UpdaterRenderer,
        collapse: false
    });
}

exports.newProjectTasks = newProjectTasks;

/* ************************************ */

function init_getLegacyFiles(legayFolder, projectName) {

    let tasks = [
        {   title: 'git clone https://github.com/cob/ClientConfs.git ' + projectName,           task: () => git().clone("https://github.com/cob/ClientConfs.git", projectName)  },
        {   title: 'cd ' + projectName,                                                         task: () => process.chdir(projectName)                                          },
        {   title: 'git filter-branch ' + legayFolder,                                          task: () => execa('git', ["filter-branch","--subdirectory-filter",legayFolder]) }
    ]

    let products = ["recordm","userm","devicem","recordm-importer","logm"]
    products.forEach( function(product) {
        tasks.push( 
            { title: "git rm " + product + "/db",                                               task: () => execa('git', ["rm",product + "/db", "-r"]).catch( () => { task.skip('Not present. Skipping.') })  }
        )
    })
 
    tasks.push(
        {   title: "git add .",                                                                 task: () => git().add(".")                    },
        {   title: "git commit -m 'Legacy cleanup´ ",                                           task: () => git().commit("Legacy cleanup")    },
        {   title: "git remove origin",                                                         task: () => git().removeRemote("origin")      }
    )

    return new Listr(tasks);
}