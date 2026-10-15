<script setup lang="ts">
import { useTemplateRef } from 'vue';

defineProps<{ message: string }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const dialog = useTemplateRef<HTMLDialogElement>('dialog');

// Native <dialog> instead of window.confirm() - accessible by default
// (focus trapped inside the modal, Escape closes via the native cancel
// event, implicit role) without needing a modal library just for this.
defineExpose({ open: () => dialog.value?.showModal() });

function confirm() {
  dialog.value?.close();
  emit('confirm');
}

function cancel() {
  dialog.value?.close();
  emit('cancel');
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-label="message"
    class="m-auto rounded-lg p-5 shadow-xl backdrop:bg-black/50"
    @cancel="emit('cancel')"
  >
    <p>{{ message }}</p>
    <div class="mt-3 text-right">
      <button
        type="button"
        class="mr-1 rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
        @click="cancel"
      >
        Cancel
      </button>
      <button
        type="button"
        class="bg-danger rounded px-3 py-1.5 text-sm text-white hover:opacity-90"
        @click="confirm"
      >
        Confirm
      </button>
    </div>
  </dialog>
</template>
