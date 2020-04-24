const execa = require('execa');
const Listr = require('listr');

function legacyProject(server) {
    return new Listr([
        {
            title: 'First...',
            task: () => execa('touch', ['server_'+server])
        },
        {
            title: 'Second...',
            task: () => execa('touch', ['server_'+server])
        },
        {
            title: 'Third..',
            task: () => execa('touch', ['server_'+server])
        }
    ]);
}

exports.legacyProject = legacyProject;
