const Listr = require('listr');
const git = require('simple-git/promise');

function existingProjectTasks(repo) {
    return new Listr([
        { title: 'git clone ' + repo,       task: () => git().clone(repo) }
    ]);
}

exports.existingProjectTasks = existingProjectTasks;