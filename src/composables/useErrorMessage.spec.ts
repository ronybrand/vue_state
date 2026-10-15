import { useErrorMessage } from './useErrorMessage';

describe('useErrorMessage', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts empty', () => {
    const { error, requestId } = useErrorMessage();
    expect(error.value).toBeNull();
    expect(requestId.value).toBeNull();
  });

  it('sets the message and request id', () => {
    const { error, requestId, setError } = useErrorMessage();
    setError('Boom', 'id-1');
    expect(error.value).toBe('Boom');
    expect(requestId.value).toBe('id-1');
  });

  it('clears itself after the default 5s', () => {
    const { error, setError } = useErrorMessage();
    setError('Boom');
    vi.advanceTimersByTime(4999);
    expect(error.value).toBe('Boom');
    vi.advanceTimersByTime(1);
    expect(error.value).toBeNull();
  });

  it('restarts the timer when a new error replaces the previous one', () => {
    const { error, setError } = useErrorMessage();
    setError('first');
    vi.advanceTimersByTime(4000);
    setError('second');
    vi.advanceTimersByTime(4000);
    expect(error.value).toBe('second');
  });

  it('honours a custom duration', () => {
    const { error, setError } = useErrorMessage();
    setError('Boom', null, 100);
    vi.advanceTimersByTime(100);
    expect(error.value).toBeNull();
  });

  it('clearError clears immediately and cancels the pending timer', () => {
    const { error, requestId, setError, clearError } = useErrorMessage();
    setError('Boom', 'id-1');
    clearError();
    expect(error.value).toBeNull();
    expect(requestId.value).toBeNull();
    setError('Again');
    vi.advanceTimersByTime(4999);
    expect(error.value).toBe('Again');
  });
});
