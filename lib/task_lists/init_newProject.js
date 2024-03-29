require('colors');
const Listr = require('listr');
const fs = require('fs-extra');
const path = require('path')
const execa = require('execa');
const git = require('simple-git');
const UpdaterRenderer = require('listr-update-renderer');
const verboseRenderer = require('listr-verbose-renderer');
const { checkConnectivity } = require("./common_helpers");
const { copyFiles } = require("./common_syncFiles");
const { registerRelease } = require("./common_releaseManager");
const { setVersion } = require("../commands/upgradeRepo");

function newProjectTasks(cmdEnv, projectName, repo, args) {
    return new Listr([
            {   title: "Check connectivity and permissions".bold,                                   task: () => checkConnectivity(cmdEnv.server) },
            {   title: "Get legacy repository",                        enabled: () => args.legacy,  task: () => _getLegacyGit(args.legacy, projectName)                                         },
            {   title: 'mkdir ' + projectName,                         enabled: () => !args.legacy, task: () => fs.mkdirs(projectName)                                                          },
            {   title: 'cd ' + projectName,                            enabled: () => !args.legacy, task: () => process.chdir(projectName)                                                      },
            {   title: 'git init',                                     enabled: () => !args.legacy, task: () => git().init()                                                                    },
            {   title: "Get initial defaults",                         enabled: () => !args.legacy, task: () => copyFiles(cmdEnv,"serverInitial","localCopy")                                   },
            {   title: "git add .",                                    enabled: () => !args.legacy, task: () => git().add(".")                                                                  },
            {   title: "git commit -m ´chore: default configuration´", enabled: () => !args.legacy, task: () => git().commit("chore: default configuration")                                    },
            {   title: 'git remote add origin ' + repo + ".git",                                    task: () => git().addRemote("origin", repo + ".git")                                        },
            {   title: "Get current config",                                                        task: () => copyFiles(cmdEnv,"serverLive","localCopy")                                      },
            {   title: "Preserve empty directories",                                                task: () => execa('find',[".","-type","d","-empty","-exec","touch","{}/.gitkeep",";"] )     },
            {   title: "add .gitignore",                                                            task: () => fs.copyFile(path.resolve(__dirname, '../../gitignore.template'), '.gitignore') },
            {   title: "initialize version file",                                                   task: () => setVersion()                                                                    },
            {   title: "initialize prod environment folder",                                        task: () => cmdEnv.initialize()                                                             },
            {   title: "git add .",                                                                 task: () => git().add(".")                                                                  },
            {   title: "git commit -m ´chore: Base configuration´ ",                                task: () => git().commit("chore: base configuration")                                       },
            {   title: "git push origin",                                                           task: () => git().push("origin","master",{"--set-upstream": null})                          },
            {   title: "Register release",                                                          task: () => registerRelease(cmdEnv)                                                         }
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
        {   title: 'git clone git@github.com:github.com/cob/ClientConfs.git ' + projectName,    task: () => git().clone("git@github.com:cob/ClientConfs.git", projectName)         },
        {   title: 'cd ' + projectName,                                                         task: () => process.chdir(projectName)                                             },
        {   title: 'git filter-branch ' + legayFolder,                                          task: () => execa('git', ["filter-branch",   "--subdirectory-filter",legayFolder]) },
        {   title: "git rm --ignore-unmatch -r recordm/db",                                     task: () => execa('git', ["rm", "recordm/db","--ignore-unmatch", "-r"])            },
        {   title: "git rm --ignore-unmatch -r confm/db",                                       task: () => execa('git', ["rm", "confm/db","--ignore-unmatch", "-r"])              },
        {   title: "git rm --ignore-unmatch -r userm/db",                                       task: () => execa('git', ["rm", "userm/db",  "--ignore-unmatch", "-r"])            },
        {   title: "git rm --ignore-unmatch -r logm/db",                                        task: () => execa('git', ["rm", "logm/db",   "--ignore-unmatch", "-r"])            },
        {   title: "git remove origin",                                                         task: () => git().removeRemote("origin")                                           },
        {   title: "git add .",                                                                 task: () => git().add(".")                                                         },
        {   title: "git commit -m 'legacy cleanup´ ",                                           task: () => git().commit("chore: legacy cleanup")                                  },
        {   title: 'git tag -d <existing tags> ',                                               task: () => _deleteLegacyTags()                                                    }
    ]
    return new Listr(tasks);
}

/* ************************************ */
async function _deleteLegacyTags() {
    const tags = await execa('git', ["tag", "-l"]);
    tags.stdout.split("\n").forEach(tag => {
        // console.log("git tag -d " + tag);
        execa('git', ["tag", "-d", tag]);
    });
}
