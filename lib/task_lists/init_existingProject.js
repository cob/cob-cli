const colors = require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');

function existingProject(projectName, args) {
    let repo = args.repoaccount + projectName;

    console.log("\Clonning", colors.blue(colors.bold(args.repoaccount + projectName)), "repository:" );
    
    return new Listr([
        {
            title: 'git clone ' + repo,
            task: () => git().clone(repo)
        }
    ]);
}

exports.existingProject = existingProject;