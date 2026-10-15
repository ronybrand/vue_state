import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import { createAppRouter } from './router';
import { queryClient } from './queryClient';
import { onSessionExpired } from './lib/sessionExpired';
import './style.css';

const router = createAppRouter();

// httpClient's 401 interceptor runs outside any component; it notifies this
// subscriber, which does the client-side navigation (see sessionExpired.ts).
onSessionExpired(() => {
  router.replace('/login');
});

createApp(App).use(router).use(VueQueryPlugin, { queryClient }).mount('#app');
