import { onScopeDispose, readonly, ref, watch, type Ref } from 'vue';

// Hand-rolled instead of pulling a utility library for one search box.
export function useDebouncedValue<T>(source: Readonly<Ref<T>>, delayMs: number): Readonly<Ref<T>> {
  const debounced = ref(source.value) as Ref<T>;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  watch(source, (value) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debounced.value = value;
    }, delayMs);
  });
  onScopeDispose(() => clearTimeout(timeoutId));

  return readonly(debounced) as Readonly<Ref<T>>;
}
