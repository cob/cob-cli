const colors = require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const execa = require('execa');
const git = require('simple-git/promise');


function newProject(server) {
    const projectName = "server_"+server;

    console.log("\New project", colors.blue(colors.bold(server)) );

    return new Listr([
        {
            title: 'mkdir ' + projectName,
            task: () => fs.mkdirs(projectName)
        },
        {
            title: 'cd ' + projectName,
            task: () => process.chdir(projectName)
        },
        {
            title: 'git init',
            task: () => git().init()
        },
        {
            title: 'git remote add origin git@gitlab.com:cob/'+projectName,
            task: () => git().addRemote("origin","git@gitlab.com:cob/" + projectName + ".git")
        },
        {
            title: "[remote] create /opt/cob-cli.git",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "[remote] yum install git",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "[remote] git init --bare",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "[remote] echo $template-post-receive >> /opt/cob-cli.git/hooks/post-receive",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "git remote add production ssh://cob@"+server+".cultofbits.com:/opt/cob-cli.git",
            task: () => git().addRemote("production","ssh://cob@"+server+".cultofbits.com:/opt/cob-cli.git")
        },
        {
            title: "[remote] rsync aczvAXHS —delete /etc/recordm/ opt/cob-cli.checkout",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "git push origin master",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "git push production master",
            task: () => execa('echo', ['dummy'])
        }
    ]);
}

exports.newProject = newProject;
