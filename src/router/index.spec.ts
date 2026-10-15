import { createMemoryHistory } from 'vue-router';
import { createAppRouter } from './index';
import { clearToken, setToken } from '../lib/tokenStorage';

function validToken() {
  return `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }))}.s`;
}

describe('router auth guard', () => {
  beforeEach(() => clearToken());
  afterEach(() => clearToken());

  it('lets anyone open the public list and login', async () => {
    const router = createAppRouter(createMemoryHistory());
    await router.push('/');
    expect(router.currentRoute.value.name).toBe('states');
    await router.push('/login');
    expect(router.currentRoute.value.name).toBe('login');
  });

  it.each(['/state/new', '/state/3/edit'])('redirects %s to /login without a token', async (p) => {
    const router = createAppRouter(createMemoryHistory());
    await router.push(p);
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it.each(['/state/new', '/state/3/edit'])('allows %s with a valid token', async (p) => {
    setToken(validToken());
    const router = createAppRouter(createMemoryHistory());
    await router.push(p);
    expect(router.currentRoute.value.path).toBe(p);
  });

  it('shows the not-found view for unknown paths', async () => {
    const router = createAppRouter(createMemoryHistory());
    await router.push('/nope');
    expect(router.currentRoute.value.name).toBe('not-found');
  });
});
