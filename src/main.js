import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import VueQrcodeReader from "vue-qrcode-reader";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import axios from "axios";
import VueAxios from "vue-axios";
import VueSweetalert2 from "vue-sweetalert2";
import VueMq from "vue-mq";

import "sweetalert2/dist/sweetalert2.min.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(VueQrcodeReader);
Vue.use(VueSweetalert2);
Vue.use(VueAxios, axios);
Vue.use(VueMq, {
  breakpoints: {
    sm: 450,
    md: 1250,
    lg: Infinity,
  },
  defaultBreakpoint: "sm",
});

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
