const execa = require('execa');
const Listr = require('listr');

function legacyProject(server) {
    return new Listr([
        {
            title: 'First...',
            task: () => execa('touch', ['2'])
        },
        {
            title: 'Second...',
            task: () => execa('touch', ['2'])
        },
        {
            title: 'Third..',
            task: () => execa('touch', ['3'])
        }
    ]);
}

exports.legacyProject = legacyProject;
