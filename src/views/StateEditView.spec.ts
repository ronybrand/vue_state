import { screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import StateEditView from './StateEditView.vue';
import { stateService } from '../services/stateService';
import { renderWithProviders } from '../testUtils';
import type { State } from '../interfaces/state';

vi.mock('../services/stateService');

const sp: State = {
  id: 3,
  name: 'Sao Paulo',
  abbreviation: 'SP',
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: null,
};

describe('StateEditView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(stateService.list).mockResolvedValue([sp]);
    vi.mocked(stateService.get).mockResolvedValue(sp);
  });

  it('loads the state and prefills the form', async () => {
    await renderWithProviders(StateEditView, { route: '/state/3/edit' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Sao Paulo'));
    expect(stateService.get).toHaveBeenCalledWith(3);
    expect(screen.getByLabelText('Abbreviation')).toHaveValue('SP');
  });

  it('saves the merged state and goes back to the list', async () => {
    const user = userEvent.setup();
    vi.mocked(stateService.update).mockResolvedValue(sp);
    const { router } = await renderWithProviders(StateEditView, { route: '/state/3/edit' });
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Sao Paulo'));
    await user.type(screen.getByLabelText('Name'), ' Capital');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(stateService.update).toHaveBeenCalledWith({ ...sp, name: 'Sao Paulo Capital' }),
    );
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'));
  });

  it('shows an error when saving fails', async () => {
    const user = userEvent.setup();
    vi.mocked(stateService.update).mockRejectedValue(new Error('boom'));
    await renderWithProviders(StateEditView, { route: '/state/3/edit' });
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Sao Paulo'));
    await user.type(screen.getByLabelText('Name'), '!');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update state.');
  });

  it('shows an error when the state cannot be loaded', async () => {
    vi.mocked(stateService.get).mockRejectedValue(new Error('boom'));
    await renderWithProviders(StateEditView, { route: '/state/3/edit' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to fetch state.');
  });

  it.each(['abc', '0', '-2', '1.5'])('rejects id "%s" without calling the API', async (id) => {
    await renderWithProviders(StateEditView, { route: `/state/${id}/edit` });
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid state.');
    expect(stateService.get).not.toHaveBeenCalled();
  });
});
