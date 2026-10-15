import { render } from '@testing-library/vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import type { Component } from 'vue';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// Mounts a component with the same plugins main.ts installs. The router is a
// real one over memory history (not a mock), so navigation assertions read
// `router.currentRoute` instead of spying on push().
export async function renderWithProviders(
  component: Component,
  {
    props = {},
    route = '/',
    queryClient = createQueryClient(),
  }: { props?: Record<string, unknown>; route?: string; queryClient?: QueryClient } = {},
) {
  const page = { template: '<div />' };
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/login', component: page },
      { path: '/state/new', component: page },
      { path: '/state/:id/edit', component: page },
    ],
  });
  await router.push(route);
  await router.isReady();
  const utils = render(component, {
    props,
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  });
  return { ...utils, router, queryClient };
}
