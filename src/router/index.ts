import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import { isTokenValid } from '../lib/tokenStorage';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

// Only mutating pages require a token, matching the backend's
// GET-is-public decision (its ADR 0017) - the list stays public.
// Views are lazy-loaded so the login page doesn't ship the form code.
export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      { path: '/', name: 'states', component: () => import('../views/StateListView.vue') },
      { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
      {
        path: '/state/new',
        name: 'state-new',
        component: () => import('../views/StateCreateView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/state/:id/edit',
        name: 'state-edit',
        component: () => import('../views/StateEditView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../views/NotFoundView.vue'),
      },
    ],
  });

  // A UI routing hint, not an authorization check (see tokenStorage.isTokenValid):
  // the backend still authorizes every request.
  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isTokenValid()) {
      return { name: 'login' };
    }
  });

  return router;
}
