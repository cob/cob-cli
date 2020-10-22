require('colors');
const fs = require('fs-extra');
const path = require('path');
const Listr = require('listr');
const git = require('simple-git/promise');
const { setupGitHooks } = require("./helpers");


function existingProjectTasks(projectName, repo) {
    return new Listr([
        { title: 'git clone ' + repo,       task: () => git().clone(repo) },
        { title: 'cd ' + projectName,       task: () => process.chdir(projectName) },
        { title: 'add commitlint config',   task: () => fs.copyFile(path.resolve(__dirname, '../templates/commitlintrc.js'), '.commitlintrc.js')   },
        { title: 'setup .git/hooks',        task: () => setupGitHooks() }
    ]);
}

exports.existingProjectTasks = existingProjectTasks;