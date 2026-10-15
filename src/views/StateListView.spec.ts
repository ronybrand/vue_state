import { screen, waitFor, within } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import StateListView from './StateListView.vue';
import { stateService } from '../services/stateService';
import { renderWithProviders } from '../testUtils';
import type { State } from '../interfaces/state';

vi.mock('../services/stateService');

const sp: State = {
  id: 1,
  name: 'Sao Paulo',
  abbreviation: 'SP',
  createdAt: '2026-01-02T03:04:05Z',
  updatedAt: null,
};
const rj: State = { ...sp, id: 2, name: 'Rio de Janeiro', abbreviation: 'RJ' };

describe('StateListView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(stateService.list).mockResolvedValue([sp, rj]);
  });

  it('shows a spinner, then the states', async () => {
    await renderWithProviders(StateListView);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Sao Paulo')).toBeInTheDocument();
    expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('offers to create the first state when there are none', async () => {
    vi.mocked(stateService.list).mockResolvedValue([]);
    await renderWithProviders(StateListView);
    expect(await screen.findByText('No states registered.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create the first state' })).toHaveAttribute(
      'href',
      '/state/new',
    );
  });

  it('shows an error with the reference id when loading fails', async () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(stateService.list).mockRejectedValue(
      new AxiosError('x', undefined, undefined, undefined, {
        data: { requestId },
      } as never),
    );
    await renderWithProviders(StateListView);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to fetch states.');
    expect(screen.getByText(`Reference ID: ${requestId}`)).toBeInTheDocument();
  });

  it('links each row to its edit page', async () => {
    await renderWithProviders(StateListView);
    expect(await screen.findByRole('link', { name: 'Edit SP' })).toHaveAttribute(
      'href',
      '/state/1/edit',
    );
  });

  it('debounces the search by 300ms and sends it as busca', async () => {
    const user = userEvent.setup();
    await renderWithProviders(StateListView);
    await screen.findByText('Sao Paulo');
    await user.type(screen.getByLabelText('Search by name or abbreviation'), 'rio');
    expect(stateService.list).not.toHaveBeenCalledWith('rio', undefined);
    await waitFor(() => expect(stateService.list).toHaveBeenCalledWith('rio', undefined));
  });

  it('sorts by a column, toggling direction and exposing aria-sort', async () => {
    const user = userEvent.setup();
    await renderWithProviders(StateListView);
    await screen.findByText('Sao Paulo');
    const header = screen.getByRole('columnheader', { name: /Abbreviation/ });
    expect(header).toHaveAttribute('aria-sort', 'none');

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    await waitFor(() => expect(stateService.list).toHaveBeenCalledWith(undefined, 'sigla,asc'));

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    await waitFor(() => expect(stateService.list).toHaveBeenCalledWith(undefined, 'sigla,desc'));
  });

  it('asks for confirmation, then deletes and refreshes the list', async () => {
    const user = userEvent.setup();
    vi.mocked(stateService.delete).mockResolvedValue(undefined);
    await renderWithProviders(StateListView);
    await user.click(await screen.findByRole('button', { name: 'Delete SP' }));
    expect(screen.getByLabelText('Are you sure you want to delete SP?')).toBeInTheDocument();
    expect(stateService.delete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(stateService.delete).toHaveBeenCalledWith(1));
    await waitFor(() => expect(stateService.list).toHaveBeenCalledTimes(2));
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    await renderWithProviders(StateListView);
    await user.click(await screen.findByRole('button', { name: 'Delete SP' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(stateService.delete).not.toHaveBeenCalled();
  });

  it('shows an error when deleting fails', async () => {
    const user = userEvent.setup();
    vi.mocked(stateService.delete).mockRejectedValue(new Error('boom'));
    await renderWithProviders(StateListView);
    await user.click(await screen.findByRole('button', { name: 'Delete SP' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to delete state.');
  });
});
