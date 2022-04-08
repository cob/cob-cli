import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import cobUiVueComponents from './plugins/cobUiVueComponents';

Vue.config.productionTip = false

new Vue({
  vuetify,
  cobUiVueComponents,
  render: function (h) { return h(App) }
}).$mount('#app')