<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { RouterLink } from 'vue-router';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ErrorMessage from '../components/ErrorMessage.vue';
import BaseIcon from '../components/BaseIcon.vue';
import BaseSpinner from '../components/BaseSpinner.vue';
import { useDebouncedValue } from '../composables/useDebouncedValue';
import { useErrorMessage } from '../composables/useErrorMessage';
import { useDeleteState, useStates } from '../composables/useStateQueries';
import { extractRequestId } from '../lib/extractRequestId';
import { apiErrorMessage } from '../lib/apiErrorMessage';
import { formatDate } from '../lib/formatDate';

type SortField = 'nome' | 'sigla';
type SortDirection = 'asc' | 'desc';

const DEBOUNCE_MS = 300;

const search = ref('');
const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS);
const sortField = ref<SortField | null>(null);
const sortDirection = ref<SortDirection>('asc');
const sort = computed(() =>
  sortField.value ? `${sortField.value},${sortDirection.value}` : undefined,
);

const {
  data,
  isLoading,
  isError,
  error: loadError,
} = useStates(() => debouncedSearch.value || undefined, sort);
const states = computed(() => data.value ?? []);
const deleteState = useDeleteState();
const { error, requestId, setError } = useErrorMessage();

watch(isError, (failed) => {
  if (failed) {
    setError(
      apiErrorMessage(loadError.value, 'Failed to fetch states.'),
      extractRequestId(loadError.value),
    );
  }
});

function handleSort(field: SortField) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
}

function ariaSort(field: SortField): 'ascending' | 'descending' | 'none' {
  if (sortField.value !== field) {
    return 'none';
  }
  return sortDirection.value === 'asc' ? 'ascending' : 'descending';
}

const confirmDialog = useTemplateRef('confirmDialog');
const pendingDelete = ref<{ id: number; abbreviation: string } | null>(null);
const confirmMessage = computed(() =>
  pendingDelete.value
    ? `Are you sure you want to delete ${pendingDelete.value.abbreviation}?`
    : 'Are you sure you want to delete this state?',
);

function askToDelete(id: number, abbreviation: string) {
  pendingDelete.value = { id, abbreviation };
  confirmDialog.value?.open();
}

function confirmDeletion() {
  if (!pendingDelete.value) {
    return;
  }
  deleteState.mutate(pendingDelete.value.id, {
    onError: (err) =>
      setError(apiErrorMessage(err, 'Failed to delete state.'), extractRequestId(err)),
  });
}

const sortableColumns: { field: SortField; label: string }[] = [
  { field: 'sigla', label: 'Abbreviation' },
  { field: 'nome', label: 'Name' },
];
</script>

<template>
  <div class="mx-auto max-w-4xl p-4">
    <ErrorMessage :error="error" :request-id="requestId" />

    <div class="mb-4 text-right">
      <RouterLink
        to="/state/new"
        class="bg-success hover:bg-success/90 inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm text-white"
      >
        <BaseIcon name="plus" />
        New state
      </RouterLink>
    </div>

    <div class="rounded border border-gray-200">
      <div class="font-display border-b border-gray-200 bg-gray-50 px-4 py-2 font-semibold">
        States
      </div>
      <div class="p-4">
        <div class="mb-3">
          <label for="state-search" class="sr-only">Search by name or abbreviation</label>
          <input
            id="state-search"
            v-model="search"
            type="search"
            placeholder="Search by name or abbreviation..."
            class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <BaseSpinner v-if="isLoading" />

        <div v-else-if="states.length === 0" class="py-3 text-center text-gray-500">
          <p>No states registered.</p>
          <RouterLink
            to="/state/new"
            class="bg-success hover:bg-success/90 mt-2 inline-block rounded px-3 py-1 text-sm text-white"
          >
            Create the first state
          </RouterLink>
        </div>

        <table v-else class="w-full text-center text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th
                v-for="column in sortableColumns"
                :key="column.field"
                class="p-2"
                :aria-sort="ariaSort(column.field)"
              >
                <button
                  type="button"
                  class="inline-flex cursor-pointer items-center gap-1 font-semibold"
                  @click="handleSort(column.field)"
                >
                  {{ column.label }}
                  <BaseIcon
                    v-if="sortField === column.field"
                    :name="sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'"
                    :size="12"
                  />
                </button>
              </th>
              <th class="hidden p-2 md:table-cell">Created</th>
              <th class="hidden p-2 md:table-cell">Last Updated</th>
              <th class="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="state in states" :key="state.id" class="border-b border-gray-100">
              <td class="p-2 font-semibold">{{ state.abbreviation }}</td>
              <td class="p-2">{{ state.name }}</td>
              <td class="hidden p-2 font-mono text-xs text-gray-500 md:table-cell">
                {{ formatDate(state.createdAt) }}
              </td>
              <td class="hidden p-2 font-mono text-xs text-gray-500 md:table-cell">
                {{ formatDate(state.updatedAt) }}
              </td>
              <td class="space-x-1 p-2">
                <RouterLink
                  :to="`/state/${state.id}/edit`"
                  :aria-label="`Edit ${state.abbreviation}`"
                  class="bg-brand hover:bg-brand-dark inline-flex items-center gap-1 rounded px-2 py-1 text-white"
                >
                  <BaseIcon name="pencil" :size="14" />
                  <span class="hidden md:inline">Edit</span>
                </RouterLink>
                <button
                  type="button"
                  :aria-label="`Delete ${state.abbreviation}`"
                  :disabled="deleteState.isPending.value"
                  class="bg-danger inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-white hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                  @click="askToDelete(state.id, state.abbreviation)"
                >
                  <BaseIcon name="trash" :size="14" />
                  <span class="hidden md:inline">Delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmDialog
      ref="confirmDialog"
      :message="confirmMessage"
      @confirm="confirmDeletion"
      @cancel="pendingDelete = null"
    />
  </div>
</template>
