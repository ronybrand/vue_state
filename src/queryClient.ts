import { QueryClient } from '@tanstack/vue-query';

// httpClient already resends failing GETs (RETRY_COUNT, see
// src/lib/httpClient.ts) - disable Vue Query's own retry so it doesn't
// duplicate attempts on top of what the interceptor already does.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
