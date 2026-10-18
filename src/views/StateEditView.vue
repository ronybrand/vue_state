<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FormPage from '../components/FormPage.vue';
import BaseSpinner from '../components/BaseSpinner.vue';
import StateForm from '../components/StateForm.vue';
import { useErrorMessage } from '../composables/useErrorMessage';
import { useStateById, useStates, useUpdateState } from '../composables/useStateQueries';
import { extractRequestId } from '../lib/extractRequestId';
import { apiErrorMessage } from '../lib/apiErrorMessage';
import type { NewState } from '../interfaces/state';

const route = useRoute();
const router = useRouter();

const stateId = computed(() => Number(route.params.id));
const validId = computed(() => Number.isInteger(stateId.value) && stateId.value > 0);

const { data: state, isLoading, isError, error: loadError } = useStateById(stateId, validId);
const updateState = useUpdateState();
const { data: states } = useStates();
const existingAbbreviations = computed(() => states.value?.map((s) => s.abbreviation));
const { error, requestId, setError, clearError } = useErrorMessage();

watch(
  [validId, isError],
  () => {
    if (!validId.value) {
      setError('Invalid state.');
    } else if (isError.value) {
      setError(
        apiErrorMessage(loadError.value, 'Failed to fetch state.'),
        extractRequestId(loadError.value),
      );
    } else {
      clearError();
    }
  },
  { immediate: true },
);

function submit(data: NewState) {
  if (!state.value) {
    return;
  }
  updateState.mutate(
    { ...state.value, ...data },
    {
      onSuccess: () => router.push('/'),
      onError: (err) =>
        setError(apiErrorMessage(err, 'Failed to update state.'), extractRequestId(err)),
    },
  );
}
</script>

<template>
  <FormPage title="Edit state" :error="error" :request-id="requestId">
    <BaseSpinner v-if="validId && isLoading" />
    <StateForm
      v-if="state"
      :initial-values="{ abbreviation: state.abbreviation, name: state.name }"
      :disabled="updateState.isPending.value"
      :existing-abbreviations="existingAbbreviations"
      @submit-state="submit"
    />
  </FormPage>
</template>
