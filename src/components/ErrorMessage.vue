<script setup lang="ts">
import { API_UNAVAILABLE_MESSAGE, startApiUrl } from '../lib/apiErrorMessage';

defineProps<{
  error: string | null;
  requestId: string | null;
}>();

// A function, not a computed: the template can't reach `window`, and the current
// URL should be read when rendered, since the SPA changes it without reloading.
function turnOnApiUrl() {
  return startApiUrl(window.location.href);
}
</script>

<template>
  <div
    v-if="error"
    role="alert"
    aria-live="assertive"
    class="border-danger bg-danger/10 text-danger mb-4 rounded border px-4 py-3"
  >
    {{ error }}
    <a
      v-if="error === API_UNAVAILABLE_MESSAGE"
      :href="turnOnApiUrl()"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-2 block underline"
      >Turn on the API</a
    >
    <small v-if="requestId" class="mt-1 block text-gray-500">Reference ID: {{ requestId }}</small>
  </div>
</template>
