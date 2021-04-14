
## cob-cli development
 * **debugging**: Using VSCode you can debug the command line behaviour. The file `.vscode/launch.json` has the commands and arguments that will be used. Note that the `cob-cli` command will run on the on the directories specified in this file.

## TODO:
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