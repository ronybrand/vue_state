import { render, screen } from '@testing-library/vue';
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
});
