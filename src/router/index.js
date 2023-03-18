import Vue from "vue";
import VueRouter from "vue-router";
import HomeView from "../views/HomeView.vue";
import { isJwtExpired } from "jwt-check-expiration";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/login",
    name: "login",
    meta: {
      requiresAuth: false,
    },
    component: () =>
      import(/* webpackChunkName: "login" */ "../views/LoginView.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.token_presenca;
    if (!token) {
      next({ path: "/login" });
    } else {
      console.log(token);
      if (isJwtExpired(token)) {
        localStorage.removeItem("token_presenca");
        next({ path: "/login" });
      } else {
        next();
      }
    }
  } else {
    next();
  }
});

export default router;
