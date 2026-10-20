import { screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import App from './App.vue';
import { infoService } from './services/infoService';
import { clearToken, getToken, setToken } from './lib/tokenStorage';
import { renderWithProviders } from './testUtils';

vi.mock('./services/infoService');

function validToken() {
  return `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }))}.s`;
}

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(infoService.getFrontendVersion).mockRejectedValue(new Error('x'));
    vi.mocked(infoService.getBackendInfo).mockRejectedValue(new Error('x'));
    clearToken();
  });
  afterEach(() => clearToken());

  it('links the title back to the list', async () => {
    await renderWithProviders(App);
    expect(screen.getByRole('link', { name: 'State CRUD - Vue/Java' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('links to the AI assistant', async () => {
    await renderWithProviders(App);
    expect(screen.getByRole('link', { name: 'Ask AI' })).toHaveAttribute('href', '/ask');
  });

  it('hides the logout button when logged out', async () => {
    await renderWithProviders(App);
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
  });

  it('logs out: clears the token and goes to /login', async () => {
    setToken(validToken());
    const { router } = await renderWithProviders(App);
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(getToken()).toBeNull();
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/login'));
  });
});
