import { effectScope, nextTick, ref } from 'vue';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with the source value and follows it after the delay', async () => {
    const source = ref('a');
    const scope = effectScope();
    const debounced = scope.run(() => useDebouncedValue(source, 300))!;
    expect(debounced.value).toBe('a');

    source.value = 'ab';
    await nextTick();
    vi.advanceTimersByTime(299);
    expect(debounced.value).toBe('a');
    vi.advanceTimersByTime(1);
    expect(debounced.value).toBe('ab');
    scope.stop();
  });

  it('only publishes the last value of a burst', async () => {
    const source = ref('');
    const scope = effectScope();
    const debounced = scope.run(() => useDebouncedValue(source, 300))!;
    for (const char of ['r', 'ri', 'rio']) {
      source.value = char;
      await nextTick();
      vi.advanceTimersByTime(100);
    }
    expect(debounced.value).toBe('');
    vi.advanceTimersByTime(300);
    expect(debounced.value).toBe('rio');
    scope.stop();
  });

  it('cancels the pending update when its scope is disposed', async () => {
    const source = ref('a');
    const scope = effectScope();
    const debounced = scope.run(() => useDebouncedValue(source, 300))!;
    source.value = 'b';
    await nextTick();
    scope.stop();
    vi.advanceTimersByTime(1000);
    expect(debounced.value).toBe('a');
  });
});
