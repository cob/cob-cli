const execa = require('execa');
const Listr = require('listr');

function newProject(server) {
    return new Listr([
        {
            title: 'A...',
            task: () => execa('touch', ['2'])
        },
        {
            title: 'B...',
            task: () => execa('touch', ['2'])
        },
        {
            title: 'C..',
            task: () => execa('touch', ['3'])
        }
    ]);
}

exports.newProject = newProject;
