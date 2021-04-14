# Templates

Mainly for `cob-cli customize` purposes, the `templates` directory has all necessary files to customize a CoB application in standard/predefined ways.

---
## cob-dashboard-template

These are the base files needed to have our recomend dashboard infra-structure. It's preconfigured with **vue**, **vuetify** , **@cob/rest-api-wrapper** and **@cob/dashboard-info** dependencies.

The steps necessary to achieve this final configuration are the following:

### 1. `vue create cob-dashboard-template` 

   The only option to select is *use version 2* of vue, ie, no babel, no lint, no test, etc.

   From the resulting directory we will only use 1 file, `package.json`.

   In 2021.04.14 the result was:
```json
{
  "name": "cob-dashboard-template",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build"
  },
  "dependencies": {
    "vue": "^2.6.11"
  },
  "devDependencies": {
    "@vue/cli-service": "~4.5.0",
    "vue-template-compiler": "^2.6.11"
  },
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead"
  ]
}
```


### 2. `vue add vuetify`

   The choosen options were:
```
? Choose a preset: Configure (advanced)
? Use a pre-made template? (will replace App.vue and HelloWorld.vue) Yes
? Use custom theme? No
? Use custom properties (CSS variables)? No
? Select icon font Material Design Icons
? Use fonts as a dependency (for Electron or offline)? No
? Use a-la-carte components? No
? Use babel/polyfill? No
? Select locale English
```
   This command will add the following lines to `package.json`

```json
"vuetify": "^2.4.0"
"vue-cli-plugin-vuetify": "~2.3.1",
```
with the following end result
```json 
{
  "name": "cob-dashboard-template",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build"
  },
  "dependencies": {
    "vue": "^2.6.11",
    "vuetify": "^2.4.0"
  },
  "devDependencies": {
    "@vue/cli-service": "~4.5.0",
    "vue-cli-plugin-vuetify": "~2.3.1",
    "vue-template-compiler": "^2.6.11"
  },
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead",
    "not ie <= 10"
  ]
}
```

Two other files are relevant for the end result:

`src/main.js`
```javascript
import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: function (h) { return h(App) }
}).$mount('#app')
```

`src/plugins/vuetify.js`
```javascript
import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';

Vue.use(Vuetify);

export default new Vuetify({
});
```

### 3. Delete all files irrelevant files
For our app we only need the files we specified above (`package.json`, `src/main.js` and `src/plugins/vuetify.js`)

### 4. Add the cob dependencies
```
npm i --save @cob/rest-api-wrapper
npm i --save @cob/dashboard-info
npm i --save @cob/ui-vue-components
```

This adds the following lines to `package.json` (in 2021.04.14):
```json
  "dependencies": {
    "@cob/dashboard-info": "^2.2.5",
    "@cob/rest-api-wrapper": "^2.1.6",
    "@cob/ui-vue-components": "^4.1.0",
```
`@cob/ui-vue-components` needs to be loaded by vue. For this add `src/plugins/cobUiVueComponents.js` and change `src/main.js`:

`src/plugins/cobUiVueComponents.js`
```javascript
import Vue from 'vue';
import CobUiVueComponents from '@cob/ui-vue-components';

Vue.use(CobUiVueComponents);

export default CobUiVueComponents
```

`src/main.js`
```javascript
import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import cobUiVueComponents from './plugins/cobUiVueComponents';
import '@babel/polyfill'

Vue.config.productionTip = false

new Vue({
  vuetify,
  cobUiVueComponents,
  render: function (h) { return h(App) }
}).$mount('#app')
```

### 5. Add an `App.vue` example
A simple page that uses all libs and adds a splash screen with the relevant links.
```html
<template>
  <v-app>
    <v-main>
      <HelloWorld 
        :msg='"Welcome " + (userInfo.username ? userInfo.username : "You") '
        :extraInfo='domainCount.value  ? "(your domain 1 has " + domainCount.value + " instances)" : "(no domain 1 instances)"'
      />
    </v-main>
  </v-app>
</template>

<script>
import { umLoggedin } from '@cob/rest-api-wrapper';
import { domainCount } from '@cob/dashboard-info';

export default {
  name: 'App',
  data: () => ({
      userInfo   : {},
      domainCount: domainCount(1),
  }),
  created() {
      umLoggedin().then( userInfo => this.userInfo = userInfo )
  }
};
</script>
```

### 6. Add webpack configuration
To run any (known) vue aplication in a CoB server there are only two files necessary to add to an existing vue project:
* `vue.config.js` - this file is the vue version os `webpack.config.js` and it has 2 purposes: 
  1. serve a version of the app with hot-reload, during development. 
  
      You can start serving the app directly on the app directory, using `npm run serve`, or on the top cob-cli project directory, with `cob-cli test -d <app dir name>`. This file will support both methods and will get the server to proxy the requests to from the top directory `.server` file. If this file is not present the `learning.cultofbits.com` server will be used.

      The entry point is the `http://localhost:8041/<app dir name>/dashboard.html` and all requests for `/<app dir name>/**` will be served locally. All CoB urls will be proxied to the specified server.

  1. build the files necessary to deploy the aplication to production

      The build process is done by `npm run build` and it will produce in `./dist` all the files that need to be copied to the server (which will be done by `cob-cli deploy`).

      While being executed this code will also set a `rmIntegrated` variable that flags if it's building the final files or serving the files (to be usedby the `dashboard.html`). 

* `src/dashboard.html` 

  because CoB servers will look at a `#/cob.custom-resource/<...>/<dashboard name>` URL and try to load `/recordm/localresource/<dashboard name>/dist/dashboard.html` this file will suport both be built for that purpose and, simultaneasly, be served locally, with the extra HTML necessary tags.

  It will produce an output for serving localy or production based on the `rmIntegrated` webpack variable.

### 7. Test the end result
After these steps you can:
```
$ cd templates/cob-dashboard-template
$ npm i 
$ npm run serve
```
it will use the `learning.cultofbits.com` site as backend and display the inteded example.



# Debugging
 Using VSCode you can debug the command line behaviour. The file `.vscode/launch.json` has the commands and arguments that will be used. Note that the `cob-cli` command will run on the on the directories specified in this file.

# TODO:
   * Support manual mode deploy (basically the copy intructions and a deploy process script)
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