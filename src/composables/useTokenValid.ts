import { readonly, ref, onScopeDispose, type Ref } from 'vue';
import { isTokenValid } from '../lib/tokenStorage';

const EXPIRY_CHECK_INTERVAL_MS = 5000;

// Reactive view over the token in localStorage. Polling covers expiry while
// the tab stays open (isTokenValid() is a pure read of `exp`, no event fires
// when it passes); the `storage` event covers login/logout in another tab.
// This is a SPA, so unlike the Next.js original there is no server render to
// disagree with: the real value is known from the first render.
export function useTokenValid(): Readonly<Ref<boolean>> {
  const valid = ref(isTokenValid());
  const refresh = () => {
    valid.value = isTokenValid();
  };

  const intervalId = setInterval(refresh, EXPIRY_CHECK_INTERVAL_MS);
  window.addEventListener('storage', refresh);
  onScopeDispose(() => {
    clearInterval(intervalId);
    window.removeEventListener('storage', refresh);
  });

  return readonly(valid);
}
