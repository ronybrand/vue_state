import { screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import StateCreateView from './StateCreateView.vue';
import { stateService } from '../services/stateService';
import { renderWithProviders } from '../testUtils';
import type { State } from '../interfaces/state';

vi.mock('../services/stateService');

const created: State = {
  id: 9,
  name: 'Sao Paulo',
  abbreviation: 'SP',
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: null,
};

async function fillAndSave() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Abbreviation'), 'sp');
  await user.type(screen.getByLabelText('Name'), 'Sao Paulo');
  await user.click(screen.getByRole('button', { name: 'Save' }));
}

describe('StateCreateView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(stateService.list).mockResolvedValue([]);
  });

  it('renders the form under a "New state" title', async () => {
    await renderWithProviders(StateCreateView, { route: '/state/new' });
    expect(screen.getByRole('heading', { name: 'New state' })).toBeInTheDocument();
  });

  it('creates the state and goes back to the list', async () => {
    vi.mocked(stateService.create).mockResolvedValue(created);
    const { router } = await renderWithProviders(StateCreateView, { route: '/state/new' });
    await fillAndSave();
    await waitFor(() =>
      expect(stateService.create).toHaveBeenCalledWith({ abbreviation: 'SP', name: 'Sao Paulo' }),
    );
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'));
  });

  it('blocks an abbreviation already in the list', async () => {
    vi.mocked(stateService.list).mockResolvedValue([created]);
    const user = userEvent.setup();
    await renderWithProviders(StateCreateView, { route: '/state/new' });
    await waitFor(() => expect(stateService.list).toHaveBeenCalled());
    await user.type(screen.getByLabelText('Abbreviation'), 'SP');
    await user.tab();
    expect(
      await screen.findByText('A state with this abbreviation already exists.'),
    ).toBeInTheDocument();
  });

  it('stays on the page and shows an error when creation fails', async () => {
    vi.mocked(stateService.create).mockRejectedValue(new Error('boom'));
    const { router } = await renderWithProviders(StateCreateView, { route: '/state/new' });
    await fillAndSave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to create state.');
    expect(router.currentRoute.value.path).toBe('/state/new');
  });
});
