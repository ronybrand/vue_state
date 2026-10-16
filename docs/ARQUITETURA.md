# Arquitetura técnica: vue_state

Frontend web em Vue 3 do CRUD de unidades federativas (estados), sobre a API do projeto `estado` (Spring Boot). É um port do `react_state` (Next.js) e irmão do Angular.

## 1. Stack

Vue 3.5 (Composition API, `<script setup>`), TypeScript estrito, Vite, Vue Router 5, TanStack Vue Query, Axios, Zod 4, Tailwind CSS 4. Testes: Vitest, Testing Library para Vue, Playwright com axe-core. ESLint (`eslint-plugin-vue`, `typescript-eslint`), Prettier, Husky e lint-staged.

## 2. Topologia

```
Navegador ──/ (estático)──▶ SPA Vue (Vercel)
         └──/api/*──────▶ Função Vercel (BFF) ──▶ estado-app (Spring Boot, EC2) ──▶ PostgreSQL
```

O navegador só fala com a própria origem. `api/proxy.ts` (lógica em `server/proxy.ts`) repassa `/api/*` ao `BACKEND_API_URL` no servidor. Por isso o back-end não precisa de CORS e a CSP não precisa citar a origem dele. Em desenvolvimento, o proxy do Vite faz o mesmo papel. `BACKEND_API_URL` não é uma variável `VITE_`, porque o Vite embutiria o valor no bundle e o navegador passaria a chamar o back-end direto, contornando o proxy.

## 3. O proxy (BFF)

`server/proxy.ts` é uma superfície pública, então é restritivo:

- Lista de caminhos permitidos (`estado`, `estado/paginado`, `estado/{n}`, `auth/login`, `actuator/info`); o resto é inalcançável mesmo que o back-end responda. A regex rejeita segmentos `.`/`..`.
- Corpo limitado a 16 KB, medido no stream (não só pelo `Content-Length`).
- Timeout de 10 s, menor que o de 15 s do cliente, para o proxy desistir primeiro e devolver um 504 limpo, que o GET pode repetir.
- Só repassa respostas JSON (`application/json`), e as respostas da API levam uma CSP `default-src 'none'; sandbox`.
- Repassa `X-Request-Id`, o IP do cliente (`X-Client-IP`, de `x-vercel-forwarded-for`) e, com `BACKEND_PROXY_SECRET`, um segredo compartilhado para o back-end confiar nesse IP. Sem ele, os limites por IP do back-end seriam compartilhados entre todos os visitantes.

## 4. Estrutura da aplicação

```
router/       rotas lazy e guarda beforeEach (meta.requiresAuth)
views/        StateList, StateCreate, StateEdit, Login, NotFound
components/   StateForm, ConfirmDialog (<dialog> nativo), FormPage, ErrorMessage, Base*
composables/  useStateQueries (Vue Query), useErrorMessage, useTokenValid, useLogin, useDebouncedValue
lib/          httpClient (Axios + interceptors), tokenStorage, sessionExpired, extractRequestId
services/     stateService + stateApiMapper, authService, infoService
interfaces/   State / NewState (Zod)
```

Direção: views, composables, services, lib. Os services importam o `httpClient`, por isso o `httpClient` **não** pode importar o router: o 401 avisa um assinante (`sessionExpired`) que `main.ts` liga ao router.

## 5. Dados e estado

- O servidor é a fonte de verdade; o Vue Query cacheia. Toda mutation invalida a chave `['states']`. A lista usa `keepPreviousData`, então mudar busca ou ordenação mantém a tabela na tela em vez de piscar o spinner.
- O contrato do back-end usa nomes em português (`sigla`, `nome`...) e o caminho `/estado`. `stateApiMapper` é uma camada anticorrupção: o resto do app só vê o tipo `State` em inglês.
- `stateService.list` busca tudo de uma vez: o domínio é fechado em 27 itens.
- Formulário: `StateForm.vue` valida com `zod.safeParse` sobre dados reativos, com `aria-invalid` e `aria-describedby`.

## 6. Rede e sessão

`httpClient` aplica timeout de 15 s, retry de até 2 tentativas só para GET (500 ms de espera) e `X-Request-Id` gerado **uma vez por ação** e mantido entre tentativas, para o log do back-end correlacionar. `Authorization: Bearer` só vai para a API (`isApiRequest` confere a fronteira da origem, para `/apievil.com` não ser tratado como a API). O token fica em `localStorage`. Um 401 limpa o token e leva ao login.

Autorização: listar e ler estados é público (decisão do back-end); criar e editar exigem token. A guarda do router é só uma dica de interface (`isTokenValid`); o back-end autoriza toda requisição.

## 7. Segurança

CSP estática e demais cabeçalhos em `vercel.json` (sem script inline na SPA). O token em `localStorage` é legível por XSS; o risco é mitigado pela CSP e por não haver HTML dinâmico, mas é uma troca consciente por simplicidade. Detalhes em `SECURITY.md`.

## 8. Testes

- Vitest e Testing Library: um `.spec.ts` ao lado de cada módulo (lib, services, composables, componentes, views, router). Piso de cobertura configurado (branch `ci/coverage-floor`).
- Playwright contra o build de produção servido pelo `vite preview`, com a API toda simulada (fixtures em `e2e/fixtures`): login, lista, criar, editar e `accessibility.spec.ts`, que roda axe-core (WCAG 2.1 A/AA) sobre cada tela. Em Playwright o navegador é real, então esta é a única stack do projeto com acessibilidade automática sobre o DOM renderizado de verdade.
- Feito com o teste primeiro (red, green, refactor).

## 9. CI e entrega

Workflows: CI (lint, typecheck, Prettier, testes, build, e2e), CodeQL e auto merge do Dependabot. Deploy na Vercel (`npx vercel --prod`), com `vercel.json` carregando o rewrite da SPA, o rewrite de `/api/:path*` para a função e os cabeçalhos. As importações relativas da função levam `.js` porque o pacote é ESM e o Node resolve sem bundler.

## 10. Trade-offs

| Escolha                     | Ganho                                           | Custo                                 |
| --------------------------- | ----------------------------------------------- | ------------------------------------- |
| BFF na Vercel               | sem CORS, back-end invisível, lista de caminhos | uma função a mais para manter e pagar |
| Vue Query                   | cache e invalidação prontos                     | outro modelo mental além de refs      |
| `localStorage` para o token | simples, funciona sem cookie                    | exposto a XSS                         |
| Camada anticorrupção        | domínio em inglês, contrato isolado             | um mapper para manter                 |
| e2e com API simulada        | rápido e determinístico                         | não pega divergência real de contrato |
