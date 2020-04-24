const execa = require('execa');
const Listr = require('listr');

function existingProject(server) {
    return new Listr([
        {
            title: '1...',
            task: () => execa('touch', ['server_'+server])
        },
        {
            title: '2...',
            task: () => execa('touch', ['server_'+server])
        },
        {
            title: '3..',
            task: () => execa('touch', ['server_'+server])
        }
    ]);
}

exports.existingProject = existingProject;
