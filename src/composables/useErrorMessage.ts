import { getCurrentScope, onScopeDispose, ref } from 'vue';

const DEFAULT_DURATION_MS = 5000;

// Transient error banner state. Returns refs (not a reactive object) so
// callers can destructure without losing reactivity.
export function useErrorMessage() {
  const error = ref<string | null>(null);
  const requestId = ref<string | null>(null);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  function clearError() {
    clearTimeout(timeoutId);
    error.value = null;
    requestId.value = null;
  }

  function setError(message: string, id: string | null = null, durationMs = DEFAULT_DURATION_MS) {
    clearTimeout(timeoutId);
    error.value = message;
    requestId.value = id;
    timeoutId = setTimeout(clearError, durationMs);
  }

  if (getCurrentScope()) {
    onScopeDispose(() => clearTimeout(timeoutId));
  }

  return { error, requestId, setError, clearError };
}
