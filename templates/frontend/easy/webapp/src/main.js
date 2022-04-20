import Vue from 'vue'
import App from './App.vue'
import Vuetify from 'vuetify'
import Components from '@cob/ui-vue-components'

Vue.config.productionTip = false
Vue.config.devtools = true

Vue.use(Vuetify, {
  iconfont: 'md',
})

Object.keys(Components).forEach(name => {
  Vue.component(name, Components[name]);
});

new Vue({
  render: h => h(App),
}).$mount('#userm-easy')
