const colors = require('colors');
const execa = require('execa');
const Listr = require('listr');

function existingProject(projectName, args) {
    console.log("\Existing project", colors.blue(colors.bold(projectName)), "on gitlab:" );

    if( args.legacy ) {
        console.log(colors.red("\nError:"),"'--legacy' is an invalid option for projects already initiated and existing on gitlab\n" );
        return
    } 

    return new Listr([
        {
            title: '1...',
            task: () => execa('echo', [projectName])
        },
        {
            title: '2...',
            task: () => execa('echo', [projectName])
        },
        {
            title: '3...',
            task: () => execa('echo', [projectName])
        }
    ]);
}

exports.existingProject = existingProject;
