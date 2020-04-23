# How to create customize CoB servers

# Installing cob-cli
`npm i -g cob-cli`

# Available commands

 * `cob-cli init <server>`
 * `cob-cli customize`
 * `cob-cli test`
 * `cob-cli deploy`

## cob-cli init \<server>

## cob-cli customize

 * ve se está num branch != master
    * se sim prossegue
    * se não lista branches existentes
    * pergunta se quer associar a alteração a um dos branchs existentes o ser é para criar um branch novo


 * General 
 * Calculations
 * Customize the color of field `state` on search result lists

### General

## cob-cli test

## cob-cli deploy
 * ve se está num branch != master
    * se sim prossegue
    * se não lista branches existentes.
 * merge para master (ff ?)
 * pergunta se quer fechar o branch.



# TODO:
   * Considerar autocomplete para cob-cli (ver package [commander-auto-complete](https://www.npmjs.com/package/commander-auto-complete)), nomeadamente a parte que refere:
      > If you want this done automatically for you, you could add that script to npm lifecycle hooks

---

# References:
   * Info base sobre como ter o comando no path e execução básica:
      * https://medium.com/@thatisuday/creating-cli-executable-global-npm-module-5ef734febe32
   * Info adicional sobre como ter vários comandos e processar os argumentos: 
      * https://itnext.io/making-cli-app-with-ease-using-commander-js-and-inquirer-js-f3bbd52977ac
   * Info sobre como publicar módulos NPM: 
      * https://zellwk.com/blog/publish-to-npm/

   * Workflow git proposto inspirado em: 
      * https://githubflow.github.io (e não em https://nvie.com/posts/a-successful-git-branching-model/)

   * Sobre o uso de git para deploys: 
      * https://dev.to/becodeorg/deploy-an-application-automatically-using-github-hooks-50fd
      * https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks


# Links consultados
## Sobre npm cli:
Utilizados:
  * https://itnext.io/making-cli-app-with-ease-using-commander-js-and-inquirer-js-f3bbd52977ac
  * https://www.twilio.com/blog/how-to-build-a-cli-with-node-js
  * https://www.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/
  * https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
 
 Não utilizados
  * https://garneslabs.com/build-your-own-node-cli-module-byo-simple-project-generator-tutorial/
  * https://nodesource.com/blog/node-js-powerful-beautiful-clis

## Sobre melhorar boilerplate vue:
 * https://gitlab.com/cob/vue-cli-preset
 * https://gitlab.com/cob/solutions-template
 * https://gitlab.com/cob/vue-cli-plugin-dashboard
 * https://medium.com/justfrontendthings/how-to-create-and-publish-your-own-vuejs-component-library-on-npm-using-vue-cli-28e60943eed3
 * https://cli.vuejs.org/dev-guide/plugin-dev.html#discoverability
 * https://javascript.info/promise-chaining#tasks
 * https://github.com/vuejs/vue-cli/tree/9c1e797ac6c25b5827403693e018eb199300d067/packages/%40vue/cli-service/generator/template/src

 ## Bibliotecas potenciais para usar:
  * https://www.npmjs.com/package/listr
  * https://www.npmjs.com/package/execa
  * https://www.npmjs.com/package/fs-extra
  * https://www.npmjs.com/package/copy-template-dir
  * https://www.npmjs.com/package/foreach-cli
  * https://www.npmjs.com/package/commander-auto-complete