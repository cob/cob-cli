# COB-CLI: customizing CoB servers
__cob-cli__ is a command line utility to help Cult of Bits partners develop with higher speed and reusing common code and best practices.

## Installing cob-cli
`npm i -g cob-cli`

## Available commands

There are 4 commands. The first, `init`, is to be run once in the begging of customization of each server. The three other should be used sequentially serveral times during development (1.`customize`, 2.`test`, 3.`deploy`).

 * `cob-cli init <servername> [-l,--legacy <folder>] [-a,--repoaccount <git acount url>]`
 * `cob-cli customize`
 * `cob-cli test`
 * `cob-cli deploy [-f,--force]`

---

### cob-cli init <server> [-l,--legacy <folder>] [-a,--repoaccount <git acount url>]

This command has two diferent behaviors, depending on the circumstances:
 1. If already exists a repo in `https:/gitlab/cob/` (or the specified --repoaccount) for this server just do a `git clone` of that repo.
 2. Otherwise, creates all the infrastucture to suport the server customization. In this last option, if the `--legacy` is used, in addition to creating the infrastructure it will try to rebuild the server customization history, existing on the legacy repo (old ClientConfs).

 By default a new repo will be created in the cob gitlab account, [https://gitlab.com/cob](https://gitlab.com/cob). 
 The `--repoaccount` option allows the use of a different account.

 In adition to setting up the local repository `cob-cli init` also creates the `.git/hooks/commit-msg` file. This will make set mandatory the use of [conventionalcommits](www.conventionalcommits.org) for the commit messages to the project.

---

### cob-cli customize

This is an interactive command. It allows you to browse the diferent customizations possible and select one. Depending on the choice mode additional details might be requested, and so on. Some examples of customizations:

 * General 
 * Totals dashboard
 * Kibana dashboard
 * Calculations
 * Customize the color of a `state` field on search result lists
 * ...

It also helps you manage the correct git workflow and provide help links to relevante trainning of each customization.

---

### cob-cli test
After running the `test` command you'll enter a livereload state were you can instantly see the effect of the changes being made. To stop this state just press any key.

Many of the changes are serverd locally from the development machine and are not propagated to the production server. These are all files that reside inside the diferent `customUI` folders. 

All other files imply a copy to the server. Each of the files copied to the server has a backup of any pre-existing one. Once the `test` command ends all copied files are removed and any existing backups are restored.

---

### cob-cli deploy [-f,--force]
This last command alows you to deploy your finished developmentto the server, garanting that there are no conflicts with changes made by other.
In adition it promotes the management of adequate and updated documentation.

The --force option allows to bypass the conflict test and deploy the local configuration independently of the existing conditions. It should be used with extreme caution and only to resolve problems not possible to resolve in other ways.

Note: This command might not be available to the whole development team and hence some member might just pre-deploy to git hub and it's up to priveledge member of the this to finalize the deploy process after, typically after review.

---

## cob-cli development
 * **debugging**: Using VSCode you can debug the command line behaviour. The file `.vscode/launch.json` has the commands and arguments that will be used. Note that the `cob-cli` command will run on the on the directories specified in this file.

---

## TODO:
   * Support user other than `cob`
   * Support manual mode deployment (basically the copy intructions and a deploy process script)
   * Consider adding autocomplete to cob-cli (see package [commander-auto-complete](https://www.npmjs.com/package/commander-auto-complete)), specifically:
      > _If you want this done automatically for you, you could add that script to npm lifecycle hooks_


# References:

## Packages 
   * Used:
      * https://www.npmjs.com/package/commander
      * https://www.npmjs.com/package/inquirer
      * https://www.npmjs.com/package/listr
      * https://www.npmjs.com/package/simple-git
      * https://www.npmjs.com/package/execa
      * https://www.npmjs.com/package/fs-extra

   * Potentials:
      * https://www.npmjs.com/package/copy-template-dir
      * https://www.npmjs.com/package/commander-auto-complete

## About npm cli
   * Base info about adding node cmds to path environment :
      * https://medium.com/@thatisuday/creating-cli-executable-global-npm-module-5ef734febe32
   * Additional info about supporting multiple commands and parsing arguments: 
      * https://itnext.io/making-cli-app-with-ease-using-commander-js-and-inquirer-js-f3bbd52977ac
   * About inquirer e listr
      * https://www.twilio.com/blog/how-to-build-a-cli-with-node-js
   * NPM package publishing: 
      * https://zellwk.com/blog/publish-to-npm/
   * Others:
      * https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
      * https://www.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/
      * https://nodesource.com/blog/node-js-powerful-beautiful-clis

## About using commit messages to manage semantic-release:
   * https://www.conventionalcommits.org/en/v1.0.0/
   * https://github.com/semantic-release/semantic-release
   * https://github.com/semantic-release/semantic-release/blob/master/docs/extending/plugins-list.md
   * https://github.com/oleg-koval/semantic-release-npm-github-publish (from [Shareable configurations list](https://github.com/semantic-release/semantic-release/blob/master/docs/extending/shareable-configurations-list.md))
   * https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits
   * https://blog.usejournal.com/semantic-release-with-nodejs-full-gitlab-ci-flow-dfee9639f20f

## About using git for production deployments
   * About deploys: 
      * https://dev.to/becodeorg/deploy-an-application-automatically-using-github-hooks-50fd
      * https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks
      * https://devcenter.heroku.com/articles/git
      * https://wpengine.com/support/git/
      * https://wpengine.com/support/deploying-code-with-bitbucket-pipelines-wp-engine/
      * https://security.stackexchange.com/questions/45452/is-using-git-for-deploying-a-bad-practice
      * https://www.git-scm.com/docs/githooks
   * Proposed git Workflow: 
      * https://githubflow.github.io (in contrast with https://nvie.com/posts/a-successful-git-branching-model/)
      * https://gist.github.com/cjsteel/5bdab49c97ecacb67904056ccdcb956d

## Improving vue boilerplate
 * https://gitlab.com/cob/vue-cli-preset
 * https://gitlab.com/cob/solutions-template
 * https://gitlab.com/cob/vue-cli-plugin-dashboard
 * https://medium.com/justfrontendthings/how-to-create-and-publish-your-own-vuejs-component-library-on-npm-using-vue-cli-28e60943eed3
 * https://cli.vuejs.org/dev-guide/plugin-dev.html#discoverability
 * https://javascript.info/promise-chaining#tasks
 * https://github.com/vuejs/vue-cli/tree/9c1e797ac6c25b5827403693e018eb199300d067/packages/%40vue/cli-service/generator/template/src