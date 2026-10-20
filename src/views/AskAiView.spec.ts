import { screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import AskAiView from './AskAiView.vue';
import { aiAgentService } from '../services/aiAgentService';
import { renderWithProviders } from '../testUtils';

vi.mock('../services/aiAgentService');

describe('AskAiView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('submits a trimmed question and renders the answer as text', async () => {
    const user = userEvent.setup();
    vi.mocked(aiAgentService.ask).mockResolvedValue({
      answer: 'O Brasil tem **27 estados**.',
    });
    await renderWithProviders(AskAiView);

    await user.type(
      screen.getByRole('textbox', { name: 'Ask about Brazilian states' }),
      '  Quantos estados existem?  ',
    );
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    await waitFor(() =>
      expect(aiAgentService.ask).toHaveBeenCalledWith('Quantos estados existem?'),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('O Brasil tem **27 estados**.');
  });

  it('does not send an empty question', async () => {
    await renderWithProviders(AskAiView);

    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
    expect(aiAgentService.ask).not.toHaveBeenCalled();
  });

  it('enforces the backend question length limit', async () => {
    await renderWithProviders(AskAiView);

    expect(screen.getByRole('textbox', { name: 'Ask about Brazilian states' })).toHaveAttribute(
      'maxlength',
      '1000',
    );
  });

  it('shows a loading state while the request is pending', async () => {
    const user = userEvent.setup();
    vi.mocked(aiAgentService.ask).mockReturnValue(new Promise(() => {}));
    await renderWithProviders(AskAiView);

    await user.type(
      screen.getByRole('textbox', { name: 'Ask about Brazilian states' }),
      'How many states are there?',
    );
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(screen.getByRole('button', { name: 'Asking...' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Asking the assistant...');
  });

  it('shows a helpful error when the API is unavailable', async () => {
    const user = userEvent.setup();
    vi.mocked(aiAgentService.ask).mockRejectedValue(
      new AxiosError('gateway unavailable', undefined, undefined, undefined, {
        status: 502,
        data: {},
      } as never),
    );
    await renderWithProviders(AskAiView);

    await user.type(
      screen.getByRole('textbox', { name: 'Ask about Brazilian states' }),
      'How many states are there?',
    );
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The API is offline');
    expect(screen.getByRole('link', { name: 'Turn on the API' })).toBeInTheDocument();
  });

  it('renders untrusted answers as text instead of interpreting HTML', async () => {
    const user = userEvent.setup();
    vi.mocked(aiAgentService.ask).mockResolvedValue({
      answer: '<img src=x onerror=alert(1)>',
    });
    await renderWithProviders(AskAiView);

    await user.type(
      screen.getByRole('textbox', { name: 'Ask about Brazilian states' }),
      'Question',
    );
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    const answer = await screen.findByRole('status');
    expect(answer).toHaveTextContent('<img src=x onerror=alert(1)>');
    expect(answer.querySelector('img')).toBeNull();
  });
});
