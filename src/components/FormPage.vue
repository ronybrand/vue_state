<script setup lang="ts">
import ErrorMessage from './ErrorMessage.vue';

defineProps<{
  title: string;
  error: string | null;
  requestId: string | null;
}>();
</script>

<template>
  <div class="mx-auto max-w-md p-4">
    <h1 class="font-display mb-4 text-xl font-semibold">{{ title }}</h1>
    <ErrorMessage :error="error" :request-id="requestId" />
    <slot />
  </div>
</template>
