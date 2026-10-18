<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import FormPage from '../components/FormPage.vue';
import StateForm from '../components/StateForm.vue';
import { useErrorMessage } from '../composables/useErrorMessage';
import { useCreateState, useStates } from '../composables/useStateQueries';
import { extractRequestId } from '../lib/extractRequestId';
import { apiErrorMessage } from '../lib/apiErrorMessage';
import type { NewState } from '../interfaces/state';

const router = useRouter();
const createState = useCreateState();
const { data: states } = useStates();
const existingAbbreviations = computed(() => states.value?.map((s) => s.abbreviation));
const { error, requestId, setError } = useErrorMessage();

function submit(state: NewState) {
  createState.mutate(state, {
    onSuccess: () => router.push('/'),
    onError: (err) =>
      setError(apiErrorMessage(err, 'Failed to create state.'), extractRequestId(err)),
  });
}
</script>

<template>
  <FormPage title="New state" :error="error" :request-id="requestId">
    <StateForm
      :disabled="createState.isPending.value"
      :existing-abbreviations="existingAbbreviations"
      @submit-state="submit"
    />
  </FormPage>
</template>
