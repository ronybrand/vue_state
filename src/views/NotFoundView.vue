<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="mx-auto max-w-md p-4" role="alert">
    <h1 class="font-display mb-2 text-xl font-semibold">Page not found</h1>
    <p class="text-gray-600">The page you are looking for does not exist.</p>
    <RouterLink to="/" class="text-brand mt-4 inline-block underline">Back to home</RouterLink>
  </div>
</template>
