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
            title: "git remote add production ssh://cob@"+server+":/opt/cob-cli.git",
            task: () => git().addRemote("production","ssh://cob@"+server+":/opt/cob-cli.git")
        },
        {
            title: "[remote] yum install git",
            task: () => execa('ssh', [server,"echo yum install git"])
        },
        {
            title: "[remote] mkdir /opt/cob-cli.git",
            task: () => execa('ssh', [server,"mkdir /opt/cob-cli.git"])
        },
        {
            title: "[remote] mkdir /opt/cob-cli.checkout",
            task: () => execa('ssh', [server,"mkdir /opt/cob-cli.checkout"])
        },
        {
            title: "[remote] git init --bare",
            task: () => execa('ssh', [server,"cd /opt/cob-cli.git && git init --bare"])
        },
        {
            title: "scp template/post-receive /opt/cob-cli.git/hooks/post-receive",
            task: () => execa('scp', [path.resolve(__dirname, '../../templates/post-receive'), "cob@" + server+ ":/opt/cob-cli.git/hooks/"])
        },
        {
            title: "[remote] chmod +x /opt/cob-cli.git/hooks/post-receive",
            task: () => execa('ssh', [server,"chmod +x /opt/cob-cli.git/hooks/post-receive"])
        },
        {
            title: "git push origin master",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "git push production master",
            task: () => execa('echo', ['dummy'])
        },
        {
            title: "[remote] rsync aczvAXHS —delete /etc/recordm/ opt/cob-cli.checkout",
            task: () => execa('ssh', [server,"mkdir /opt/cob-cli.git"])
        }
    ]);
}

exports.newProject = newProject;
