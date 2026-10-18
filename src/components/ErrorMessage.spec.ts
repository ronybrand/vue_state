import { render, screen } from '@testing-library/vue';
import { API_UNAVAILABLE_MESSAGE, startApiUrl } from '../lib/apiErrorMessage';
import ErrorMessage from './ErrorMessage.vue';

describe('ErrorMessage', () => {
  it('renders nothing without an error', () => {
    render(ErrorMessage, { props: { error: null, requestId: null } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders an assertive alert with the message', () => {
    render(ErrorMessage, { props: { error: 'Failed', requestId: null } });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Failed');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.queryByText(/Reference ID/)).not.toBeInTheDocument();
  });

  it('shows the reference id when present', () => {
    render(ErrorMessage, { props: { error: 'Failed', requestId: 'abc' } });
    expect(screen.getByText('Reference ID: abc')).toBeInTheDocument();
  });

  it('offers the turn-on link only when the API is unavailable', async () => {
    const { rerender } = render(ErrorMessage, {
      props: { error: API_UNAVAILABLE_MESSAGE, requestId: null },
    });

    const link = screen.getByRole('link', { name: 'Turn on the API' });
    expect(link).toHaveAttribute('href', startApiUrl(window.location.href));
    expect(link.getAttribute('href')).toContain(
      'lang=en&back=' + encodeURIComponent(window.location.href),
    );
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    await rerender({ error: 'Failed', requestId: null });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
