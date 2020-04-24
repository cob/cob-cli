const execa = require('execa');
const Listr = require('listr');

function newProject(server) {
    return new Listr([
        {
            title: 'A...',
            task: () => execa('touch', ['server_'+server])
        },
        {
            title: 'B...',
            task: () => execa('touch', ['server_'+server])
        },
        {
            title: 'C...',
            task: () => execa('touch', ['server_'+server])
        }
    ]);
}

exports.newProject = newProject;
