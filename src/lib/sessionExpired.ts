// A tiny module-level pub/sub instead of importing the router into
// httpClient.ts: the router's views import services, which import httpClient,
// so importing the router back would be a cycle. main.ts subscribes once and
// does the actual client-side navigation to /login.
type Listener = () => void;

const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySessionExpired(): void {
  for (const listener of listeners) {
    listener();
  }
}
