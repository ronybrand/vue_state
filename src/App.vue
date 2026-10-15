<script setup lang="ts">
import { watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import AppFooter from './components/AppFooter.vue';
import BaseIcon from './components/BaseIcon.vue';
import { useTokenValid } from './composables/useTokenValid';
import { authService } from './services/authService';

const router = useRouter();
const route = useRoute();
const loggedIn = useTokenValid();

function logout() {
  authService.logout();
  router.push('/login');
}

// The router guard only runs on navigation: a token that expires while a
// protected page stays open (polled by useTokenValid) must still bounce out.
watch(loggedIn, (valid) => {
  if (!valid && route.meta.requiresAuth) {
    router.replace('/login');
  }
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <nav class="bg-brand flex items-center justify-between px-4 py-3">
      <RouterLink to="/" class="font-display text-lg font-semibold text-white">
        State CRUD - Vue/Java
      </RouterLink>
      <button
        v-if="loggedIn"
        type="button"
        aria-label="Sair"
        title="Sair"
        class="cursor-pointer text-white"
        @click="logout"
      >
        <BaseIcon name="box-arrow-right" />
      </button>
    </nav>
    <div class="flex-1"><RouterView /></div>
    <AppFooter />
  </div>
</template>
