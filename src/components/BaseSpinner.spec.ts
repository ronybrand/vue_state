import { render, screen } from '@testing-library/vue';
import BaseSpinner from './BaseSpinner.vue';

it('exposes a status role with an accessible label', () => {
  render(BaseSpinner);
  expect(screen.getByRole('status')).toHaveTextContent('Loading...');
});
