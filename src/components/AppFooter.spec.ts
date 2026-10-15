import { screen, waitFor } from '@testing-library/vue';
import AppFooter from './AppFooter.vue';
import { infoService } from '../services/infoService';
import { renderWithProviders } from '../testUtils';

vi.mock('../services/infoService');

const front = { commit: 'abc1234', buildDate: '2026-01-02T03:04:05Z' };
const back = { build: { commit: 'def5678', time: '2026-01-02T03:04:05Z' } };

describe('AppFooter', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders nothing when both lookups fail', async () => {
    vi.mocked(infoService.getFrontendVersion).mockRejectedValue(new Error('x'));
    vi.mocked(infoService.getBackendInfo).mockRejectedValue(new Error('x'));
    const { container } = await renderWithProviders(AppFooter);
    await new Promise((r) => setTimeout(r, 20));
    expect(container.querySelector('footer')).toBeNull();
  });

  it('shows front and back build info separated by a bar', async () => {
    vi.mocked(infoService.getFrontendVersion).mockResolvedValue(front);
    vi.mocked(infoService.getBackendInfo).mockResolvedValue(back);
    await renderWithProviders(AppFooter);
    await waitFor(() => expect(screen.getByText(/front abc1234/)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/back def5678/)).toBeInTheDocument());
    expect(screen.getByText('|')).toBeInTheDocument();
  });

  it('shows only the side that answered, without a separator', async () => {
    vi.mocked(infoService.getFrontendVersion).mockResolvedValue(front);
    vi.mocked(infoService.getBackendInfo).mockRejectedValue(new Error('x'));
    await renderWithProviders(AppFooter);
    await waitFor(() => expect(screen.getByText(/front abc1234/)).toBeInTheDocument());
    expect(screen.queryByText('|')).toBeNull();
  });
});
