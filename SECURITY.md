# Security Policy

## Supported versions

This is a single-branch portfolio project (no maintained release lines): security fixes land on
`main` only, then roll out to the live deployment. There is no LTS/backport policy.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a suspected vulnerability. Instead, use
[GitHub's private vulnerability reporting](../../security/advisories/new) for this repository
(Security tab, "Report a vulnerability"), or contact the maintainer through the email on the
[GitHub profile](https://github.com/ronybrand).

Include, where applicable:

- A description of the vulnerability and its potential impact.
- Steps to reproduce (a minimal request or payload is ideal).
- The affected page or API route.

This project is maintained on a best-effort basis (no SLA), but reports are taken seriously.
Reports affecting the running deployment get priority.

## Scope

In scope: the application code in this repository, including the Vercel Function
(`api/proxy.ts`, logic in `server/proxy.ts`) that forwards `/api/*` to the backend, and the CI/CD
workflows that build and ship it.

Out of scope: the [`estado`](https://github.com/ronybrand/estado) API it talks to through the
proxy, covered by its own policy. Dependency vulnerabilities are tracked automatically via
Dependabot and CodeQL rather than manual reports.

## What this project already does

- **Static CSP and security headers** in `vercel.json`: `script-src 'self'` (the SPA has no inline
  scripts), `frame-ancestors 'none'`, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`.
- **Restrictive proxy** (`server/proxy.ts`): only the endpoints the app calls are reachable
  (allowlist, `.`/`..` segments rejected), request bodies are capped at 16 KB (also while
  streaming), only JSON responses are relayed, and every API response carries
  `default-src 'none'; sandbox`.
- **No header injection**: only a UUID `X-Request-Id` is forwarded; `X-Client-IP` and
  `X-Proxy-Secret` are built server-side and never copied from the browser's request.
- **Fail loudly in production** when `BACKEND_API_URL` is missing, instead of silently falling back
  to localhost.
- **Token handling**: the JWT lives in `localStorage` (an accepted XSS exposure for a stateless SPA
  with a single admin scope). Client-side expiry checks are a routing hint only; the backend
  authorizes every request.
- Automated dependency updates via Dependabot (auto-merged after CI for non-major bumps) and static
  analysis on every push and pull request with [CodeQL](.github/workflows/codeql.yml).
- No secrets in the repository: the backend URL and proxy secret are Vercel environment variables.
