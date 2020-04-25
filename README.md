# COB-CLI: customizing CoB servers

## Installing cob-cli
`npm i -g cob-cli`

## Available commands

There are 4 commands. The first, `init`, is to be run once in the begging of customization of each server. The three other should be used sequentially serveral times during development (1.`customize`, 2.`test`, 3.`deploy`).

 * `cob-cli init <server> [-l,--legacy <folder>]`
 * `cob-cli customize`
 * `cob-cli test`
 * `cob-cli deploy`

---

### cob-cli init \<server> [--legacy <folder>]

This command has three diferent behaviors, depending on the circumstances:
 1. If already exists a repo in gitlab for this server just do a `git clone` of that repo.
 2. Otherwise, creates all the infrastucture to suport the server customization. 
 3. In this last option, if the `--legacy` is used, in addition to creating the infrastructure it will try to rebuild the server customization history, existing on the legacy repo.

`cob-cli init` should be run on a directory that is not already in a git repo, that does not already have a project directory for this server, and in a computer with access to the server and the internet.

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
After running the `test` command you'll enter a livereload state were you can instantly see the effect of the changes being made. Almost all this changes are local to the development machine and are not propagated to the production server.

---

### cob-cli deploy
This last command alows you to close a development branch and deploy it to the server, garanting that there are no conflicts and no changes made to the server are reverted.
In adition it promotes the management of adequate and updated documentation.

Note: This command might not be available to the whole development team and hence some member might just pre-deploy to git hub and it's up to priveledge member of the this to finalize the deploy process after, typically after review.

---

## TODO:
   * Support user other than `cob`
   * Support manual mode deployment (basically the copy intructions and deploy process - considerar pelo menos a Lidl e Abanca)
   * Consider adding autocomplete to cob-cli (see package [commander-auto-complete](https://www.npmjs.com/package/commander-auto-complete)), specifically:
      > If you want this done automatically for you, you could add that script to npm lifecycle hooks


# References:

## About npm cli
Used:
   * Base info about adding node cmds to path environment :
      * https://medium.com/@thatisuday/creating-cli-executable-global-npm-module-5ef734febe32
   * Additional about supporting multiple commands and parsing arguments: 
      * https://itnext.io/making-cli-app-with-ease-using-commander-js-and-inquirer-js-f3bbd52977ac
   * NPM package publishing: 
      * https://zellwk.com/blog/publish-to-npm/
   * About inquirer e listr
      * https://www.twilio.com/blog/how-to-build-a-cli-with-node-js
   * Others:
      * https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
      * https://www.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/
      * https://nodesource.com/blog/node-js-powerful-beautiful-clis

## About using git for production deployments
   * About deploys: 
      * https://dev.to/becodeorg/deploy-an-application-automatically-using-github-hooks-50fd
      * https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks
      * https://devcenter.heroku.com/articles/git
      * https://wpengine.com/support/git/
      * https://wpengine.com/support/deploying-code-with-bitbucket-pipelines-wp-engine/
      * https://security.stackexchange.com/questions/45452/is-using-git-for-deploying-a-bad-practice
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

## Packages 
   * Used:
      * https://www.npmjs.com/package/commander
      * https://www.npmjs.com/package/inquirer
      * https://www.npmjs.com/package/listr
      * https://www.npmjs.com/package/execa
      * https://www.npmjs.com/package/fs-extra

   * Potentials:
      * https://www.npmjs.com/package/copy-template-dir
      * https://www.npmjs.com/package/foreach-cli
      * https://www.npmjs.com/package/commander-auto-complete

# cob-cli development

 * Using VSCode you can debug the command line behaviour. The file `.vscode/launch.json` has the command and arguments that will be used. Note that the `cob-cli` will run on the upper directory of where the project is located, as specified in this file.