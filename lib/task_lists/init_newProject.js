const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');
const path = require('path');


function newProject(server) {
    const projectName = "server_"+server;
    server = server+".cultofbits.com"

    console.log("\New project", colors.blue(colors.bold(server)) );

    return new Listr([
        {
            title: 'mkdir ' + projectName,                                                         task: () => fs.mkdirs(projectName)
        },{
            title: 'cd ' + projectName,                                                            task: () => process.chdir(projectName)
        },{
            title: 'git init',                                                                     task: () => git().init()
        },{
            title: "Get initial defaults",                                                         task: () => init_rsync(server,"default",projectName)
        },{
            title: "git add .",                                                                    task: () => execa('echo', ['dummy'])
        },{
            title: "git commit -m ´Initial defaults´ ",                                            task: () => execa('echo', ['dummy'])
        },{
            title: "Get current config",                                                           task: () => init_rsync(server,"current",projectName)
        },{
            title: "git add .",                                                                    task: () => execa('echo', ['dummy'])
        },{
            title: "git commit -m ´Initial configuration´ ",                                       task: () => execa('echo', ['dummy'])
        },
        {
            title: "[remote] yum install git",                                                     task: () => execa('ssh', [server,"echo yum install git"])
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
            title: "[remote] chmod +x /opt/cob-cli.production.git/hooks/pre-receive ",             task: () => execa('ssh', [server,"chmod +x /opt/cob-cli.production.git/hooks/pre-receive"])
        },{
            title: "[remote] create /opt/cob-cli.production.git/hooks/post-receive",               task: () => execa('scp', [path.resolve(__dirname, '../../templates/production-post-receive'), "cob@" + server+ ":/opt/cob-cli.production.git/hooks/post-receive"])
        },{
            title: "[remote] chmod +x /opt/cob-cli.production.git/hooks/post-receive",             task: () => execa('ssh', [server,"chmod +x /opt/cob-cli.production.git/hooks/post-receive"])
        },{
            title: "git remote add production ssh://cob@"+server+":/opt/cob-cli.production.git",   task: () => git().addRemote("production","ssh://cob@"+server+":/opt/cob-cli.production.git")
        },{
            title: "git push production master",                                                   task: () => execa('echo', ['dummy'])
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
            title: "[remote] chmod +x /opt/cob-cli.staging.git/hooks/post-receive",                task: () => execa('ssh', [server,"chmod +x /opt/cob-cli.staging.git/hooks/post-receive"])
        },{
            title: "[remote] chmod +x /opt/cob-cli.staging.git/hooks/pre-receive",                 task: () => execa('ssh', [server,"chmod +x /opt/cob-cli.staging.git/hooks/pre-receive"])
        },{
            title: "git remote add staging ssh://cob@"+server+":/opt/cob-cli.git",                 task: () => git().addRemote("staging","ssh://cob@"+server+":/opt/cob-cli.staging.git")
        },{
            title: "git push staging master",                                                      task: () => execa('echo', ['dummy'])
        },
        {
            title: 'git remote add origin git@gitlab.com:cob/'+projectName,                        task: () => git().addRemote("origin","git@gitlab.com:cob/" + projectName + ".git")
        },{
            title: "git push origin master",                                                       task: () => execa('echo', ['dummy'])
        }
    ]);
}

exports.newProject = newProject;


function init_rsync(server,type,projectName) {
    let products = ["recordm","integrationm","devicem","userm"]

    let product = "recordm";
    let serverPath = type === "default" ? "/opt/" + product + "/etc.default/"  : "/etc/" + product + "/";
    let tasks = [];
     products.forEach( function(product) {
        tasks.push( 
            {
               title: "Sync " + type + " " + product,
               task: (ctx, task) => execa('rsync', [server + ":/opt/"+product+"/etc.default/*",path.resolve(".")+"/"+product+"/","-aczv","--exclude=db","--delete"])
                                        .catch((err) => {
                                            if(err.exitCode == 23) task.skip('Not present');
                                    })
            }
        )
    })
    debugger;
    return new Listr(tasks, {concurrent: true});
}