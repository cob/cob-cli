const execa = require('execa');
const fs = require('fs-extra');
const Listr = require('listr');

function existingProject(server) {
    return new Listr([
        {
            title: 'Test if project repository already exists',
            task: () => execa('git', ['status', '--porcelain']).then(result => {
                if (result !== '') {
                    throw new Error('Unclean working tree. Commit or stash changes first.');
                }
            })
        },
        {
            title: 'Checking remote history',
            task: () => execa('git', ['status', '--porcelain']).then(result => {
                if (result == '1') {
                    throw new Error('Remote history differ. Please pull changes.');
                }
            })
        }
    ]);
}

exports.existingProject = existingProject;
