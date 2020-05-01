const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');


function newProject(server, args) {
    const projectName = "server_"+server;
    server = server+".cultofbits.com"

    console.log("\New project", colors.blue(colors.bold(server)) );

    return new Listr([
        {
            title: "Get legacy repository",                        skip: () => !args.legacy,       task: () => init_legacy(args.legacy, projectName)
        },{
            title: 'mkdir ' + projectName,                         skip: () => args.legacy,        task: () => fs.mkdirs(projectName)
        },{
            title: 'cd ' + projectName,                            skip: () => args.legacy,        task: () => process.chdir(projectName)
        },{
            title: 'git init',                                     skip: () => args.legacy,        task: () => git().init()
        },{
            title: "Get initial defaults",                         skip: () => args.legacy,        task: () => init_rsync(server,"default")
        },{
            title: "git add .",                                    skip: () => args.legacy,        task: () => git().add(".")
        },{
            title: "git commit -m ´Default configuration´ ",       skip: () => args.legacy,        task: () => git().commit("Default configuration")
        },{
            title: "Get current config",                                                           task: () => init_rsync(server,"current")
        },{
            title: "git add .",                                                                    task: () => git().add(".")
        },{
            title: "git commit -m ´Base configuration´ ",                                          task: () => git().commit("Base configuration")
        },
        {
            title: "TODO [remote] yum install git",                                                task: () => execa('ssh', [server,"echo yum install git"])
        },
        {
            title: "[remote] mkdir /opt/cob-cli.production.git",                                   task: () => execa('ssh', [server,"mkdir /opt/cob-cli.production.git"])
        },{
            title: "[remote] mkdir /opt/cob-cli.production.checkout",                              task: () => execa('ssh', [server,"mkdir /opt/cob-cli.production.checkout"])
        },{
            title: "[remote] cd cob-cli.production.git && git init --bare",                        task: () => execa('ssh', [server,"cd /opt/cob-cli.production.git && git init --bare"])
        },{
            title: "[remote] create /opt/cob-cli.production.git/hooks/pre-receive",                task: () => execa('scp', [path.resolve(__dirname, '../../templates/production-pre-receive'), "cob@" + server+ ":/opt/cob-cli.production.git/hooks/pre-receive"])
        },{
            title: "[remote] chmod a+x /opt/cob-cli.production.git/hooks/pre-receive ",            task: () => execa('ssh', [server,"chmod a+x /opt/cob-cli.production.git/hooks/pre-receive"])
        },{
            title: "[remote] create /opt/cob-cli.production.git/hooks/post-receive",               task: () => execa('scp', [path.resolve(__dirname, '../../templates/production-post-receive'), "cob@" + server+ ":/opt/cob-cli.production.git/hooks/post-receive"])
        },{
            title: "[remote] chmod a+x /opt/cob-cli.production.git/hooks/post-receive",            task: () => execa('ssh', [server,"chmod a+x /opt/cob-cli.production.git/hooks/post-receive"])
        },{
            title: "git remote add production ssh://cob@"+server+":/opt/cob-cli.production.git",   task: () => git().addRemote("production","ssh://cob@"+server+":/opt/cob-cli.production.git")
        },
        {
            title: "[remote] mkdir /opt/cob-cli.staging.git",                                      task: () => execa('ssh', [server,"mkdir /opt/cob-cli.staging.git"])
        },{
            title: "[remote] mkdir /opt/cob-cli.staging.checkout",                                 task: () => execa('ssh', [server,"mkdir /opt/cob-cli.staging.checkout"])
        },{
            title: "[remote] cd cob-cli.staging.git && git init --bare",                           task: () => execa('ssh', [server,"cd /opt/cob-cli.staging.git && git init --bare"])
        },{
            title: "[remote] create /opt/cob-cli.staging.git/hooks/post-receive",                  task: () => execa('scp', [path.resolve(__dirname, '../../templates/staging-post-receive'), "cob@" + server+ ":/opt/cob-cli.staging.git/hooks/post-receive"])
        },{
            title: "[remote] create /opt/cob-cli.staging.git/hooks/pre-receive",                   task: () => execa('scp', [path.resolve(__dirname, '../../templates/staging-pre-receive'), "cob@" + server+ ":/opt/cob-cli.staging.git/hooks/pre-receive"])
        },{
            title: "[remote] chmod a+x /opt/cob-cli.staging.git/hooks/post-receive",               task: () => execa('ssh', [server,"chmod a+x /opt/cob-cli.staging.git/hooks/post-receive"])
        },{
            title: "[remote] chmod a+x /opt/cob-cli.staging.git/hooks/pre-receive",                task: () => execa('ssh', [server,"chmod a+x /opt/cob-cli.staging.git/hooks/pre-receive"])
        },{
            title: "git remote add staging ssh://cob@"+server+":/opt/cob-cli.git",                 task: () => git().addRemote("staging","ssh://cob@"+server+":/opt/cob-cli.staging.git")
        },
        {
            title: 'git remote add origin ' + args.repoaccount + projectName + ".git",             task: () => git().addRemote("origin",args.repoaccount + projectName + ".git")
        },
        {
            title: 'git config core.compression 5',                                                task: () => git().addConfig("core.compression", 4) //Sem isto o push para production e staging falha muitas vezes
        },{
            title: "git push origin",                                                              task: () => git().push("origin","master",{"--set-upstream": null})
        },{
            title: "git push production master",                                                   task: () => git().push("production","master").catch( () => console.error("Try `git push production master` later") )
        },{
            title: "git push staging release",                                                     task: () => git().push("staging","master").catch( () => console.error("Try `git push staging master` later") )
        }
    ]);
}

exports.newProject = newProject;

/* **************************************************************************************** */

function init_rsync(server,type) {
    let products = ["recordm","integrationm","userm","devicem","recordm-importer","logm"]
    let tasks = [];
    products.forEach( function(product) {
        let serverPath = (type === "default") ?
                            "/opt/" + product + "/etc.default/*"  
                            : (product === "recordm-importer") ? 
                                "/opt/" + product + "/*"
                                : "/etc/" + product + "/*"
        tasks.push( 
            {
            title: "Sync " + type + " " + product,
            task: (ctx, task) => execa('rsync', [
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
                                        .catch((err) => {
                                            if(err.exitCode == 23) task.skip('Not present');
                                    })
            }
        )
    })
    return new Listr(tasks, {concurrent: true});
}

/* ************************************ */

function init_legacy(legayFolder, projectName) {

    let tasks = [
        {
            title: 'git clone https://github.com/cob/ClientConfs.git ' + projectName,              task: () => git().clone("https://github.com/cob/ClientConfs.git", projectName)
        },{
            title: 'cd ' + projectName,                                                            task: () => process.chdir(projectName)
        },{
            title: 'git filter-branch ' + legayFolder,                                             task: () => execa('git', ["filter-branch","--subdirectory-filter",legayFolder])
        }
    ]

    let products = ["recordm","userm","devicem","recordm-importer","logm"]
    products.forEach( function(product) {
        tasks.push( 
            {
                title: "git rm " + product + "/db",                                                task: (ctx, task) => execa('git', ["rm",product + "/db", "-r"]).catch(() => {
                                                                                                                            task.skip('Not present. Skipping.');
                                                                                                                        })
    
            }
        )
    })
 
    tasks.push(
        {
            title: "git add .",                                                                    task: () => git().add(".")
        },{
            title: "git commit -m 'Legacy cleanup´ ",                                              task: () => git().commit("Legacy cleanup")
        },{
            title: "git remove origin",                                                            task: () => git().removeRemote("origin")
        }
    )

    return new Listr(tasks);
}