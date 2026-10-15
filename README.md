# vue_state

CRUD for Brazilian federative units (states) built with **Vue 3**. It is a port of the
`react_state` (Next.js) frontend and consumes the same Java/Spring Boot REST API
(`/estado`, `/auth/login`, `/actuator/info`).

## Stack

- Vue 3 (Composition API, `<script setup>`) + TypeScript strict + Vite
- Vue Router (lazy routes, `beforeEach` auth guard)
- TanStack Vue Query (fetching, caching, invalidation)
- Axios (request id, timeout and GET retry interceptors)
- Zod (validation and domain types)
- Tailwind CSS v4
- Vitest + Testing Library for Vue (159 tests), ESLint (`eslint-plugin-vue`), Prettier

## React to Vue mapping

| React / Next.js                        | Vue                                                    |
| -------------------------------------- | ------------------------------------------------------ |
| `hooks/useX` (React Query)             | `composables/useStateQueries.ts` (Vue Query)           |
| `useErrorMessage` (useState)           | `composables/useErrorMessage.ts` (refs)                |
| `useTokenValid` (useSyncExternalStore) | `composables/useTokenValid.ts` (ref + scope cleanup)   |
| `ProtectedRoute` + `(protected)` group | `meta.requiresAuth` + `router.beforeEach`              |
| react-hook-form + zodResolver          | `StateForm.vue` with `zod.safeParse` on reactive data  |
| `ConfirmDialog` forwardRef             | `ConfirmDialog.vue` with `defineExpose({ open })`      |
| `app/api/[...path]/route.ts` (BFF)     | `server/proxy.ts` via `api/[...path].ts` + Vite proxy  |
| `proxy.ts` per-request CSP nonce       | static CSP in `vercel.json` (no inline scripts in SPA) |

## Running

```bash
npm install
BACKEND_API_URL=http://localhost:8080 npm run dev   # Vite proxies /api to the backend
npm run test
npm run build
```

`BACKEND_API_URL` (and optionally `BACKEND_PROXY_SECRET`, used to forward the real client IP) are
server-side only: never expose them as `VITE_*`, which would be inlined into the browser bundle and
bypass the proxy.

## Design notes

- **Composition API only**, typed `defineProps`/`defineEmits`, `useTemplateRef`, `v-for` always keyed,
  base components prefixed `Base*`, multi-word component names, composables named `useX`.
- **Why the session-expired pub/sub stays:** `httpClient` cannot import the router (views import
  services, which import `httpClient`), so `main.ts` subscribes once and navigates.
- **Why `keepPreviousData`:** changing the search/sort keeps the table on screen instead of flashing
  the spinner on every keystroke.
- **Async side effects:** none added. Everything is a synchronous request/response to the backend.
- The JWT lives in `localStorage` (accepted XSS exposure for a stateless SPA and a single admin
  scope); `isTokenValid` is a routing hint only, the backend authorizes every request.

## Not ported

Playwright e2e/accessibility suites, Husky/lint-staged and the Dependabot automation of the React repo.
