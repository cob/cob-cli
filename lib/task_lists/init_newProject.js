const colors = require('colors');
const execa = require('execa');
const Listr = require('listr');

function newProject(server) {
    console.log("\New project", colors.blue(colors.bold(server)) );

    return new Listr([
        {
            title: 'A...',
            task: () => execa('echo', ['server_'+server])
        },
        {
            title: 'B...',
            task: () => execa('echo', ['server_'+server])
        },
        {
            title: 'C...',
            task: () => execa('echo', ['server_'+server])
        }
    ]);
}

exports.newProject = newProject;
