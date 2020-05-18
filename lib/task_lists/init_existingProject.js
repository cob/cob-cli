const colors = require('colors');
const Listr = require('listr');
const git = require('simple-git/promise');
const path = require('path');
const fs = require('fs-extra');


function existingProjectTasks(projectName, args) {
    let repo = args.repoaccount + projectName;

    console.log("\Clonning", colors.blue(colors.bold(args.repoaccount + projectName)), "repository:" );
    let windows = false; /*TODO: eval if we're on Windos*/
    
    return new Listr([
        {
            title: 'git clone ' + repo,
            task: () => git().clone(repo)
        },
        {
            title: 'setup .git/hooks',
            task: () => {
                process.chdir(projectName+"/.git/hooks")
                fs.writeFile('commit-msg', ""
                    + (windows ? "#!C:/Program\ Files/Git/usr/bin/sh.exe" : "#!/bin/sh" ) 
                    + "\n\n"
                    + "node " + path.resolve(__dirname, "../../node_modules/@commitlint/cli/lib/cli.js") + " -g " + path.resolve(__dirname, "../../node_modules/@commitlint/config-conventional/index.js") + "  -e \"$1\" \n"
                )
                fs.chmodSync('commit-msg', "0755")
            }
        }
    ]);
}

exports.existingProjectTasks = existingProjectTasks;