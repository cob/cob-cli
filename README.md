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



# References:
   * Info base sobre como ter o comando no path e execução básica:  https://medium.com/@thatisuday/creating-cli-executable-global-npm-module-5ef734febe32
   * Info adicional sobre como ter vários comandos e processar os argumentos: https://itnext.io/making-cli-app-with-ease-using-commander-js-and-inquirer-js-f3bbd52977ac
   * Info sobre como publicar módulos NPM: 
      * https://zellwk.com/blog/publish-to-npm/

   * Workflow proposto inspirado em: 
      * https://githubflow.github.io (e não em https://nvie.com/posts/a-successful-git-branching-model/)

   * Sobre usar git para deploys: 
      * https://dev.to/becodeorg/deploy-an-application-automatically-using-github-hooks-50fd
      * https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks


# TODO:
   * Considerar autocomplete para cob-cli (ver https://www.npmjs.com/package/commander-auto-complete)
      > If you want this done automatically for you, you could add that script to npm lifecycle hooks