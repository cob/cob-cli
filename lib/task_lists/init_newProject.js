const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const { syncFiles } = require("./syncFiles");


function newProjectTasks(serverName, args) {
    const projectName = "server_"+serverName;
    const server = serverName+".cultofbits.com"
    let windows = false; /*TODO: eval if we're on Windos*/

    console.log("\nNew project", colors.blue(colors.bold(server)) );

    return new Listr([
        {   title: "Get legacy repository",                        skip: () => !args.legacy,    task: () => init_getLegacyFiles(args.legacy, projectName)                                   },

        {   title: 'mkdir ' + projectName,                         skip: () => args.legacy,     task: () => fs.mkdirs(projectName)                                                          },
        {   title: 'cd ' + projectName,                            skip: () => args.legacy,     task: () => process.chdir(projectName)                                                      },
        {   title: 'git init',                                     skip: () => args.legacy,     task: () => git().init()                                                                    },
        {
            title: 'setup .git/hooks',
            task: () => {
                fs.writeFile('.git/hooks/commit-msg', ""
                    + (windows ? "#!C:/Program\ Files/Git/usr/bin/sh.exe" : "#!/bin/sh" ) 
                    + "\n\n"
                    + "node " + path.resolve(__dirname, "../../node_modules/@commitlint/cli/lib/cli.js") + " -g " + path.resolve(__dirname, "../../node_modules/@commitlint/config-conventional/index.js") + "  -e \"$1\" \n"
                )
                fs.chmodSync('.git/hooks/commit-msg', "0755")
            }
        },
        {   title: "Get initial defaults",                         skip: () => args.legacy,     task: () => syncFiles(server,"productionDefault","localMaster", false)                      },
        {   title: "git add .",                                    skip: () => args.legacy,     task: () => git().add(".")                                                                  },
        {   title: "git commit -m ´chore: default configuration´", skip: () => args.legacy,     task: () => git().commit("chore: default configuration")                                    },
        
        {   title: 'git remote add origin ' + args.repoaccount + projectName + ".git",          task: () => git().addRemote("origin",args.repoaccount + projectName + ".git")               },
        {   title: "Get current config",                                                        task: () => syncFiles(server,"productionLive","localMaster", false)                         },
        {   title: "add .gitignore",                                                            task: () => fs.copyFile(path.resolve(__dirname, '../templates/gitignore'), '.gitignore')    },
        {   title: "add .server ",                                                              task: () => fs.writeFile('.server', serverName)                                             },
        {   title: "git add .",                                                                 task: () => git().add(".")                                                                  },
        {   title: "git commit -m ´chore: Base configuration´ ",                                task: () => git().commit("chore: base configuration")                                       },
        {   title: "git push origin",                                                           task: () => git().push("origin","master",{"--set-upstream": null})                          },
        {   title: "semantic-release -e deploy_semanticReleaseConfiguration --no-ci",                            
            task: () => execa("node",[
                            path.resolve(__dirname, '../../node_modules/semantic-release/bin/semantic-release.js'),
                            "-e",path.resolve(__dirname, 'deploy_semanticReleaseConfiguration.js'),
                            "--no-ci"]
                        ) 
        },

        {   title: "[remote] mkdir /opt/cob-cli.production.checkout",                           task: () => execa('ssh', [server,"mkdir /opt/cob-cli.production.checkout"])                 },
        {   title: "[Remote] Put current config in production.checkout",                        task: () => syncFiles(server,"localMaster","productionMaster", false)                       },
    ],{
        renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
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
            { title: "git rm --ignore-unmatch -r " + product + "/db",                           task: () => execa('git', ["rm",product + "/db","--ignore-unmatch", "-r"]).catch( () => { task.skip('Not present. Skipping.') })  }
        )
    })
 
    tasks.push(
        {   title: "git remove origin",                                                         task: () => git().removeRemote("origin")      },
        {   title: "git add .",                                                                 task: () => git().add(".")                    },
        {   title: "git commit -m 'legacy cleanup´ ",                                           task: () => git().commit("chore: legacy cleanup")    },
        {   
            title: 'git tag -d * ',                                                             
            task: (async () => {
                const tags = await execa('git', ["tag","-l"])
                tags.stdout.split("\n").forEach( tag => {
                    console.log("git tag -d " + tag)
                    execa('git', ["tag","-d",tag]) 
                })
            })
        }
    )

    return new Listr(tasks);
}