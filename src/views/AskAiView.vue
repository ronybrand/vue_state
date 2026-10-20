<script setup lang="ts">
import { ref } from 'vue';
import ErrorMessage from '../components/ErrorMessage.vue';
import { useErrorMessage } from '../composables/useErrorMessage';
import { apiErrorMessage } from '../lib/apiErrorMessage';
import { extractRequestId } from '../lib/extractRequestId';
import { aiAgentService } from '../services/aiAgentService';

const MAX_QUESTION_LENGTH = 1000;
const SOURCE_REPO_URL = 'https://github.com/ronybrand/estado-ai-agent';
const question = ref('');
const answer = ref<string | null>(null);
const isAsking = ref(false);
const { error, requestId, setError, clearError } = useErrorMessage();

async function ask() {
  const trimmedQuestion = question.value.trim();
  if (!trimmedQuestion || isAsking.value) {
    return;
  }

  answer.value = null;
  clearError();
  isAsking.value = true;

  try {
    const response = await aiAgentService.ask(trimmedQuestion);
    answer.value = response.answer;
  } catch (err) {
    setError(
      apiErrorMessage(err, 'Failed to reach the assistant. Please try again shortly.'),
      extractRequestId(err),
    );
  } finally {
    isAsking.value = false;
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-4">
    <ErrorMessage :error="error" :request-id="requestId" />

    <section class="rounded border border-gray-200">
      <h1 class="font-display border-b border-gray-200 bg-gray-50 px-4 py-3 text-lg font-semibold">
        Ask about the Brazilian states
      </h1>

      <div class="p-4">
        <p class="mb-2 text-sm text-gray-600">
          A tool-calling AI assistant queries the live states API; answers are not scripted.
        </p>
        <p class="mb-4 text-sm text-gray-500">
          Ask in Portuguese or English. Questions can contain up to {{ MAX_QUESTION_LENGTH }}
          characters.
        </p>

        <form @submit.prevent="ask">
          <label for="ai-question" class="sr-only">Ask about Brazilian states</label>
          <textarea
            id="ai-question"
            v-model="question"
            :maxlength="MAX_QUESTION_LENGTH"
            :disabled="isAsking"
            rows="3"
            placeholder="E.g.: How many states are in the Southeast region?"
            class="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
          <button
            type="submit"
            :disabled="isAsking || !question.trim()"
            class="bg-brand hover:bg-brand-dark inline-flex cursor-pointer items-center gap-2 rounded px-4 py-2 text-sm text-white disabled:cursor-default disabled:opacity-50"
          >
            <span
              v-if="isAsking"
              aria-hidden="true"
              class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            />
            {{ isAsking ? 'Asking...' : 'Ask' }}
          </button>
          <span v-if="isAsking" role="status" aria-live="polite" class="sr-only">
            Asking the assistant...
          </span>
        </form>

        <div
          v-if="answer !== null"
          role="status"
          aria-live="polite"
          class="mt-4 rounded bg-gray-50 p-4 text-sm"
        >
          <p class="whitespace-pre-wrap">{{ answer }}</p>
        </div>
      </div>

      <footer class="border-t border-gray-200 px-4 py-3 text-center">
        <a
          :href="SOURCE_REPO_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-gray-500 underline"
        >
          View source on GitHub
        </a>
      </footer>
    </section>
  </main>
</template>
