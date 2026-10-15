import { render, screen } from '@testing-library/vue';
import FormPage from './FormPage.vue';

it('renders the title, the error and the slot content', () => {
  render(FormPage, {
    props: { title: 'New state', error: 'Oops', requestId: null },
    slots: { default: '<p>body</p>' },
  });
  expect(screen.getByRole('heading', { name: 'New state' })).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Oops');
  expect(screen.getByText('body')).toBeInTheDocument();
});
