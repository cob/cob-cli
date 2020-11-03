require('colors');
const fs = require('fs-extra');
const path = require('path');
const Listr = require('listr');
const git = require('simple-git/promise');
const { setupGitHooks } = require("./helpers");


function existingProjectTasks(projectName, repo) {
    return new Listr([
        { title: 'git clone ' + repo,       task: () => git().clone(repo) }
    ]);
}

exports.existingProjectTasks = existingProjectTasks;