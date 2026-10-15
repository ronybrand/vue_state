import { effectScope } from 'vue';
import { useTokenValid } from './useTokenValid';
import { clearToken, setToken } from '../lib/tokenStorage';

function jwt(expSecondsFromNow: number) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }));
  return `h.${payload}.s`;
}

describe('useTokenValid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearToken();
  });
  afterEach(() => {
    vi.useRealTimers();
    clearToken();
  });

  it('is false without a token and true with a valid one', () => {
    const scope = effectScope();
    expect(scope.run(() => useTokenValid())!.value).toBe(false);
    setToken(jwt(60));
    expect(scope.run(() => useTokenValid())!.value).toBe(true);
    scope.stop();
  });

  it('flips to false by polling once the token expires', () => {
    setToken(jwt(7));
    const scope = effectScope();
    const valid = scope.run(() => useTokenValid())!;
    expect(valid.value).toBe(true);
    vi.advanceTimersByTime(10_000);
    expect(valid.value).toBe(false);
    scope.stop();
  });

  it('reacts to a login/logout in another tab (storage event)', () => {
    const scope = effectScope();
    const valid = scope.run(() => useTokenValid())!;
    setToken(jwt(60));
    window.dispatchEvent(new Event('storage'));
    expect(valid.value).toBe(true);
    clearToken();
    window.dispatchEvent(new Event('storage'));
    expect(valid.value).toBe(false);
    scope.stop();
  });

  it('stops polling and listening when its scope is disposed', () => {
    const scope = effectScope();
    const valid = scope.run(() => useTokenValid())!;
    scope.stop();
    setToken(jwt(60));
    vi.advanceTimersByTime(10_000);
    window.dispatchEvent(new Event('storage'));
    expect(valid.value).toBe(false);
  });
});
