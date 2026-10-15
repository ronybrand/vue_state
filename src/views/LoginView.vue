<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import FormPage from '../components/FormPage.vue';
import { useErrorMessage } from '../composables/useErrorMessage';
import { useLogin } from '../composables/useLogin';
import { extractRequestId } from '../lib/extractRequestId';
import type { LoginCredentials } from '../services/authService';

const router = useRouter();
const login = useLogin();
const { error, requestId, setError } = useErrorMessage();
const credentials = reactive<LoginCredentials>({ username: '', password: '' });
const canSubmit = computed(
  () => Boolean(credentials.username && credentials.password) && !login.isPending.value,
);

// isPending only flips after the next render, so a second Enter fired before
// it would still see false - this flag is set synchronously and closes the gap.
let submitInFlight = false;

function submit() {
  if (submitInFlight || !canSubmit.value) {
    return;
  }
  submitInFlight = true;

  login.mutate(
    { ...credentials },
    {
      onSuccess: () => router.push('/'),
      onError: (err) => {
        submitInFlight = false;
        setError('Invalid username or password.', extractRequestId(err));
      },
    },
  );
}

const inputClass =
  'col-span-12 rounded border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:border-danger';
</script>

<template>
  <FormPage title="Login" :error="error" :request-id="requestId">
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label for="username" class="mb-1 block text-sm font-medium text-gray-700">Username</label>
        <input
          id="username"
          v-model="credentials.username"
          autocomplete="username"
          :class="inputClass"
        />
      </div>

      <div>
        <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          v-model="credentials.password"
          type="password"
          autocomplete="current-password"
          :class="inputClass"
        />
      </div>

      <div class="text-right">
        <button
          type="submit"
          :disabled="!canSubmit"
          class="bg-brand hover:bg-brand-dark inline-flex cursor-pointer items-center gap-1 rounded px-4 py-1.5 text-white disabled:cursor-default disabled:opacity-50"
        >
          Log in
        </button>
      </div>
    </form>
    <p class="mt-4 text-sm text-gray-600" data-testid="demo-credentials">
      Demo credentials (intentionally public): <strong>admin</strong> /
      <strong>Estado-Demo-2026</strong>
    </p>
  </FormPage>
</template>
