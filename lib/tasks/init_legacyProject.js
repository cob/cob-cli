const colors = require('colors');
const execa = require('execa');
const Listr = require('listr');

function legacyProject(server, args) {
    console.log("\New project", colors.blue(colors.bold(server)), "(bootstrap with legacy",colors.underline("https://github.com/cob/ClientConf/" + args.legacy), ")" );

    return new Listr([
        {
            title: 'First...',
            task: () => execa('echo', ['server_'+server])
        },
        {
            title: 'Second...',
            task: () => execa('echo', ['server_'+server])
        },
        {
            title: 'Third..',
            task: () => execa('echo', ['server_'+server])
        }
    ]);
}

exports.legacyProject = legacyProject;
