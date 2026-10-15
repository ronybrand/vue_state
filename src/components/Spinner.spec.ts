import { render, screen } from '@testing-library/vue';
import Spinner from './Spinner.vue';

it('exposes a status role with an accessible label', () => {
  render(Spinner);
  expect(screen.getByRole('status')).toHaveTextContent('Loading...');
});
