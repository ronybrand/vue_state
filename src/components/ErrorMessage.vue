<script setup lang="ts">
defineProps<{
  error: string | null;
  requestId: string | null;
}>();
</script>

<template>
  <div
    v-if="error"
    role="alert"
    aria-live="assertive"
    class="border-danger bg-danger/10 text-danger mb-4 rounded border px-4 py-3"
  >
    {{ error }}
    <small v-if="requestId" class="mt-1 block text-gray-500">Reference ID: {{ requestId }}</small>
  </div>
</template>
