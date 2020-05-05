const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');


function newProject(server, args) {
    const projectName = "server_"+server;
    server = server+".cultofbits.com"

    console.log("\nNew project", colors.blue(colors.bold(server)) );

    return new Listr([
        {   title: "Get legacy repository",                        skip: () => !args.legacy,    task: () => init_legacy(args.legacy, projectName)                                },

        {   title: 'mkdir ' + projectName,                         skip: () => args.legacy,     task: () => fs.mkdirs(projectName)                                               },
        {   title: 'cd ' + projectName,                            skip: () => args.legacy,     task: () => process.chdir(projectName)                                           },
        {   title: 'git init',                                     skip: () => args.legacy,     task: () => git().init()                                                         },
        {   title: "Get initial defaults",                         skip: () => args.legacy,     task: () => init_getFiles(server,"default")                                      },
        {   title: "git add .",                                    skip: () => args.legacy,     task: () => git().add(".")                                                       },
        {   title: "git commit -m ´Default configuration´ ",       skip: () => args.legacy,     task: () => git().commit("Default configuration")                                },

        {   title: "Get current config",                                                        task: () => init_getFiles(server,"current")                                      },
        {   title: "git add .",                                                                 task: () => git().add(".")                                                       },
        {   title: "git commit -m ´Base configuration´ ",                                       task: () => git().commit("Base configuration")                                   },
        {   title: 'git remote add origin ' + args.repoaccount + projectName + ".git",          task: () => git().addRemote("origin",args.repoaccount + projectName + ".git")    },
        {   title: "git push origin",                                                           task: () => git().push("origin","master",{"--set-upstream": null})               },

        {   title: "[remote] mkdir /opt/cob-cli.production.checkout",                           task: () => execa('ssh', [server,"mkdir /opt/cob-cli.production.checkout"])      },
        {   title: "[Remote] Put current config in production.checkout",                        task: () => init_putFiles(server,"production-checkout")                          },
        {   title: "[remote] mkdir /opt/cob-cli.staging.checkout",                              task: () => execa('ssh', [server,"mkdir /opt/cob-cli.staging.checkout"])         },
        {   title: "[Remote] Put current config in staging.checkout",                           task: () => init_putFiles(server,"staging-checkout")                             }
    ]);
}

exports.newProject = newProject;

/* **************************************************************************************** */

function init_getFiles(server,type) {
    let tasks = [];
    let products = ["recordm","integrationm","userm","devicem","recordm-importer","logm"]
    products.forEach( function(product) {
        let serverPath = (type === "default") ?
                            "/opt/" + product + "/etc.default/*"  
                            : (product === "recordm-importer") ? 
                                "/opt/recordm-importer/*"
                                : "/etc/" + product + "/*"
        tasks.push( {
            title: "Sync " + type + " " + product,                                              task: (ctx, task) => execa('rsync', [
                                                                                                                                server + ":" + serverPath,
                                                                                                                                path.resolve(".")+"/"+product+"/",
                                                                                                                                "-aczv",
                                                                                                                                "--delete",
                                                                                                                                "--exclude=db",
                                                                                                                                "--exclude=node_modules",
                                                                                                                                "--exclude=build",
                                                                                                                                "--exclude=uploaded",
                                                                                                                                "--exclude=.processed",
                                                                                                                                "--exclude=.failed",
                                                                                                                                "--exclude=recordm-importer.log*",
                                                                                                                                "--exclude=recordm-importer*.jar"
                                                                                                                        ])
                                                                                                                        .catch((err) => { if(err.exitCode == 23) task.skip('Not present') })
        })
    })
    return new Listr(tasks, {concurrent: true});
}

/* ************************************ */

function init_putFiles(server,type) { //type= staging, production-control, production
    let products = ["recordm","integrationm","userm","devicem","recordm-importer","logm"]
    let tasks = [];
    products.forEach( function(product) {
        let serverPath = (type === "production-checkout") ?
                            "/opt/cob-cli.production.checkout/" + product
                            : (product === "staging-checkout") ? 
                                "/opt/cob-cli.staging.checkout/" + product
                                : (product === "recordm-importer") ? 
                                    "/opt/" + product + "/*"
                                    : "/etc/" + product + "/*"
        tasks.push( {
            title: "Sync " + type + " " + product,                                              task: (ctx, task) => execa('rsync', [
                                                                                                                                path.resolve(".")+"/"+product+"/",
                                                                                                                                "-aczv",
                                                                                                                                "--delete",
                                                                                                                                server + ":" + serverPath
                                                                                                                        ])
                                                                                                                        .catch((err) => { if(err.exitCode == 23) task.skip('Not present') })
        })
    })
    return new Listr(tasks, {concurrent: true});
}

/* ************************************ */

function init_legacy(legayFolder, projectName) {

    let tasks = [
        {   title: 'git clone https://github.com/cob/ClientConfs.git ' + projectName,           task: () => git().clone("https://github.com/cob/ClientConfs.git", projectName)  },
        {   title: 'cd ' + projectName,                                                         task: () => process.chdir(projectName)                                          },
        {   title: 'git filter-branch ' + legayFolder,                                          task: () => execa('git', ["filter-branch","--subdirectory-filter",legayFolder]) }
    ]

    let products = ["recordm","userm","devicem","recordm-importer","logm"]
    products.forEach( function(product) {
        tasks.push( 
            { title: "git rm " + product + "/db",                                               task: (ctx, task) => execa('git', ["rm",product + "/db", "-r"]).catch( () => { task.skip('Not present. Skipping.') })  }
        )
    })
 
    tasks.push(
        {   title: "git add .",                                                                 task: () => git().add(".")                    },
        {   title: "git commit -m 'Legacy cleanup´ ",                                           task: () => git().commit("Legacy cleanup")    },
        {   title: "git remove origin",                                                         task: () => git().removeRemote("origin")      }
    )

    return new Listr(tasks);
}

/* ************************************ */