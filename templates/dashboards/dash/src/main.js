import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

import "./output.css";
import './assets/css/all.min.css';

new Vue({
  render: function (h) { return h(App) }
}).$mount('#app')