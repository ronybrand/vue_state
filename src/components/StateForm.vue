<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import Icon from './Icon.vue';
import { createNewStateSchema, type NewState } from '../interfaces/state';

const props = withDefaults(
  defineProps<{
    initialValues?: NewState;
    disabled?: boolean;
    existingAbbreviations?: string[];
  }>(),
  { initialValues: undefined, disabled: false, existingAbbreviations: () => [] },
);
const emit = defineEmits<{ 'submit-state': [state: NewState] }>();

type Field = keyof NewState;

const initial = computed<NewState>(() => props.initialValues ?? { abbreviation: '', name: '' });
const values = reactive<NewState>({ ...initial.value });
const touched = reactive<Record<Field, boolean>>({ abbreviation: false, name: false });

// The edit page loads the state asynchronously, so the form is mounted
// before (or re-fed after) its initial values arrive.
watch(initial, (next) => Object.assign(values, next));

const schema = computed(() =>
  createNewStateSchema(props.existingAbbreviations, props.initialValues?.abbreviation),
);
const result = computed(() => schema.value.safeParse(values));

const messages = computed(() => {
  const found: Partial<Record<Field, string>> = {};
  if (!result.value.success) {
    for (const issue of result.value.error.issues) {
      const field = issue.path[0] as Field;
      found[field] ??= issue.message;
    }
  }
  return found;
});

// Errors only appear once a field has been blurred, then track every
// keystroke (the react-hook-form "onTouched" mode of the original).
const visibleError = (field: Field) => (touched[field] ? messages.value[field] : undefined);

const isValid = computed(() => result.value.success);
const isDirty = computed(
  () => values.abbreviation !== initial.value.abbreviation || values.name !== initial.value.name,
);
const canSave = computed(() => isValid.value && isDirty.value && !props.disabled);

function onAbbreviationInput(event: Event) {
  const input = event.target as HTMLInputElement;
  input.value = input.value.toUpperCase();
  values.abbreviation = input.value;
}

function submit() {
  if (result.value.success) {
    emit('submit-state', result.value.data);
  }
}

const inputClass =
  'col-span-12 rounded border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:border-danger';
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label for="abbreviation" class="mb-1 block text-sm font-medium text-gray-700">
        Abbreviation
      </label>
      <input
        id="abbreviation"
        :value="values.abbreviation"
        maxlength="2"
        size="2"
        :class="inputClass"
        :aria-invalid="visibleError('abbreviation') ? true : undefined"
        aria-describedby="abbreviation-error"
        @input="onAbbreviationInput"
        @blur="touched.abbreviation = true"
      />
      <div
        v-if="visibleError('abbreviation')"
        id="abbreviation-error"
        class="text-danger mt-1 text-sm"
      >
        {{ visibleError('abbreviation') }}
      </div>
    </div>

    <div>
      <label for="name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
      <input
        id="name"
        v-model="values.name"
        placeholder="Enter the state name..."
        :class="[inputClass, 'w-full']"
        :aria-invalid="visibleError('name') ? true : undefined"
        aria-describedby="name-error"
        @blur="touched.name = true"
      />
      <div v-if="visibleError('name')" id="name-error" class="text-danger mt-1 text-sm">
        {{ visibleError('name') }}
      </div>
    </div>

    <div class="text-right">
      <button
        type="submit"
        :disabled="!canSave"
        class="bg-brand hover:bg-brand-dark inline-flex cursor-pointer items-center gap-1 rounded px-4 py-1.5 text-white disabled:cursor-default disabled:opacity-50"
      >
        <Icon name="check" :size="14" />
        Save
      </button>
    </div>
  </form>
</template>
