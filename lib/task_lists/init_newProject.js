require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const path = require('path')
const execa = require('execa');
const git = require('simple-git/promise');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const { setupGitHooks, semanticRelease, copyFiles } = require("./helpers");


function newProjectTasks(serverName, server, projectName, repo, args) {
    return new Listr([
            {   title: "Get legacy repository",                        enabled: () => args.legacy,  task: () => _getLegacyGit(args.legacy, projectName)                                         },
            {   title: 'mkdir ' + projectName,                         enabled: () => !args.legacy, task: () => fs.mkdirs(projectName)                                                          },
            {   title: 'cd ' + projectName,                            enabled: () => !args.legacy, task: () => process.chdir(projectName)                                                      },
            {   title: 'git init',                                     enabled: () => !args.legacy, task: () => git().init()                                                                    },
            {   title: 'setup .git/hooks',                                                          task: () => setupGitHooks()                                                                 },
            {   title: "Get initial defaults",                         enabled: () => !args.legacy, task: () => copyFiles(server,"productionDefault","localMaster")                             },
            {   title: "git add .",                                    enabled: () => !args.legacy, task: () => git().add(".")                                                                  },
            {   title: "git commit -m ´chore: default configuration´", enabled: () => !args.legacy, task: () => git().commit("chore: default configuration")                                    },
            {   title: 'git remote add origin ' + repo + ".git",                                    task: () => git().addRemote("origin", repo + ".git")                                        },
            {   title: "Get current config",                                                        task: () => copyFiles(server,"productionLive","localMaster")                                },
            {   title: "Preserve empty directories",                                                task: () => execa('find',[".","-type","d","-empty","-exec","touch","{}/.gitkeep",";"] )     },
            {   title: "add .gitignore",                                                            task: () => fs.copyFile(path.resolve(__dirname, '../templates/gitignore'), '.gitignore')    },
            {   title: "add .server ",                                                              task: () => fs.writeFile('.server', serverName)                                             },
            {   title: "git add .",                                                                 task: () => git().add(".")                                                                  },
            {   title: "git commit -m ´chore: Base configuration´ ",                                task: () => git().commit("chore: base configuration")                                       },
            {   title: "git push origin",                                                           task: () => git().push("origin","master",{"--set-upstream": null})                          },
            {   title: "semantic-release -e deploy_semanticReleaseConfiguration --no-ci",           task: () => semanticRelease()                                                               },
            {   title: "[remote] Put current config in production.checkout",                        task: () => copyFiles(server,"localMaster","productionMaster" )                             },
        ],{
            renderer: args.verbose ? verboseRenderer : UpdaterRenderer,
            collapse: false
        }
    )
}
exports.newProjectTasks = newProjectTasks;

/* ************************************ */
function _getLegacyGit(legayFolder, projectName) {
    let tasks = [
        {   title: 'git clone https://github.com/cob/ClientConfs.git ' + projectName,           task: () => git().clone("https://github.com/cob/ClientConfs.git", projectName)     },
        {   title: 'cd ' + projectName,                                                         task: () => process.chdir(projectName)                                             },
        {   title: 'git filter-branch ' + legayFolder,                                          task: () => execa('git', ["filter-branch",   "--subdirectory-filter",legayFolder]) },
        {   title: "git rm --ignore-unmatch -r recordm/db",                                     task: () => execa('git', ["rm", "recordm/db","--ignore-unmatch", "-r"])            },
        {   title: "git rm --ignore-unmatch -r confm/db",                                       task: () => execa('git', ["rm", "confm/db","--ignore-unmatch", "-r"])               },
        {   title: "git rm --ignore-unmatch -r userm/db",                                       task: () => execa('git', ["rm", "userm/db",  "--ignore-unmatch", "-r"])            },
        {   title: "git rm --ignore-unmatch -r logm/db",                                        task: () => execa('git', ["rm", "logm/db",   "--ignore-unmatch", "-r"])            },
        {   title: "git remove origin",                                                         task: () => git().removeRemote("origin")                                           },
        {   title: "git add .",                                                                 task: () => git().add(".")                                                         },
        {   title: "git commit -m 'legacy cleanup´ ",                                           task: () => git().commit("chore: legacy cleanup")                                  },
        {   title: 'git tag -d <existing tags> ',                                               task: () => _deleteLegacyTags()                                                    }
    ]
    return new Listr(tasks);
}

async function _deleteLegacyTags() {
    const tags = await execa('git', ["tag", "-l"]);
    tags.stdout.split("\n").forEach(tag => {
        // console.log("git tag -d " + tag);
        execa('git', ["tag", "-d", tag]);
    });
}
