import { screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import LoginView from './LoginView.vue';
import { authService } from '../services/authService';
import { renderWithProviders } from '../testUtils';

vi.mock('../services/authService');

async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Username'), 'admin');
  await user.type(screen.getByLabelText('Password'), 'secret');
  return user;
}

describe('LoginView', () => {
  beforeEach(() => vi.resetAllMocks());

  it('keeps Log in disabled until both fields are filled', async () => {
    const user = userEvent.setup();
    await renderWithProviders(LoginView, { route: '/login' });
    const button = screen.getByRole('button', { name: 'Log in' });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Username'), 'admin');
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('Password'), 'secret');
    expect(button).toBeEnabled();
  });

  it('logs in and goes to the list', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: 't', expiresInSeconds: 60 });
    const { router } = await renderWithProviders(LoginView, { route: '/login' });
    const user = await fill();
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith({ username: 'admin', password: 'secret' }),
    );
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'));
  });

  it('shows an error and stays on the page when credentials are rejected', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('401'));
    const { router } = await renderWithProviders(LoginView, { route: '/login' });
    const user = await fill();
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('ignores a second submit while the first is in flight', async () => {
    vi.mocked(authService.login).mockReturnValue(new Promise(() => {}));
    await renderWithProviders(LoginView, { route: '/login' });
    const user = await fill();
    await user.type(screen.getByLabelText('Password'), '{Enter}{Enter}');
    expect(authService.login).toHaveBeenCalledTimes(1);
  });

  it('lets the user retry after a failure', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('401'));
    await renderWithProviders(LoginView, { route: '/login' });
    const user = await fill();
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(2));
  });

  it('shows the public demo credentials', async () => {
    await renderWithProviders(LoginView, { route: '/login' });
    expect(screen.getByTestId('demo-credentials')).toHaveTextContent('admin');
  });
});
