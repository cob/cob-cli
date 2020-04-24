const colors = require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');

function existingProject(projectName, args) {
    let repo = "https://gitlab.com/mimes70/"+projectName;

    console.log("\Project", colors.blue(colors.bold(projectName)), "exists on gitlab:" );
    
    if( args.legacy ) {
        console.log(colors.red("\nError:"),"'--legacy' is an invalid option for projects already initiated and existing on gitlab\n" );
        return
    } 

    return new Listr([
        {
            title: 'git clone ' + repo,
            task: () => git().clone(repo)
        }
    ]);
}

exports.existingProject = existingProject;