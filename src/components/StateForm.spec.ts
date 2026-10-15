import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import StateForm from './StateForm.vue';

const save = () => screen.getByRole('button', { name: 'Save' });

describe('StateForm', () => {
  it('keeps Save disabled while invalid', () => {
    render(StateForm);
    expect(save()).toBeDisabled();
  });

  it('enables Save when abbreviation and name are valid', async () => {
    const user = userEvent.setup();
    render(StateForm);
    await user.type(screen.getByLabelText('Abbreviation'), 'SP');
    await user.type(screen.getByLabelText('Name'), 'Sao Paulo');
    expect(save()).toBeEnabled();
  });

  it('upper-cases the abbreviation as the user types', async () => {
    const user = userEvent.setup();
    render(StateForm);
    const input = screen.getByLabelText('Abbreviation');
    await user.type(input, 'sp');
    expect(input).toHaveValue('SP');
  });

  it('shows no error before the field is touched', async () => {
    const user = userEvent.setup();
    render(StateForm);
    await user.type(screen.getByLabelText('Abbreviation'), 'S');
    expect(screen.queryByText('Enter the state abbreviation with 2 letters.')).toBeNull();
  });

  it('flags the abbreviation after blur and links the message via aria-describedby', async () => {
    const user = userEvent.setup();
    render(StateForm);
    const input = screen.getByLabelText('Abbreviation');
    await user.type(input, 'S');
    await user.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'abbreviation-error');
    expect(screen.getByText('Enter the state abbreviation with 2 letters.')).toBeInTheDocument();
  });

  it('revalidates on every keystroke once touched', async () => {
    const user = userEvent.setup();
    render(StateForm);
    const input = screen.getByLabelText('Abbreviation');
    await user.type(input, 'S');
    await user.tab();
    await user.click(input);
    await user.type(input, 'P');
    expect(screen.queryByText('Enter the state abbreviation with 2 letters.')).toBeNull();
  });

  it('shows min and max name messages', async () => {
    const user = userEvent.setup();
    render(StateForm);
    const name = screen.getByLabelText('Name');
    await user.type(name, 'AB');
    await user.tab();
    expect(
      screen.getByText('Enter the state name with at least 3 characters.'),
    ).toBeInTheDocument();
    await user.clear(name);
    await user.click(name);
    await user.paste('A'.repeat(101));
    await user.tab();
    expect(
      screen.getByText('Enter the state name with at most 100 characters.'),
    ).toBeInTheDocument();
  });

  it('rejects an abbreviation that already exists', async () => {
    const user = userEvent.setup();
    render(StateForm, { props: { existingAbbreviations: ['SP'] } });
    await user.type(screen.getByLabelText('Abbreviation'), 'SP');
    await user.tab();
    expect(screen.getByText('A state with this abbreviation already exists.')).toBeInTheDocument();
  });

  it('keeps Save disabled until something changes from the initial values', async () => {
    const user = userEvent.setup();
    render(StateForm, {
      props: {
        initialValues: { abbreviation: 'SP', name: 'Sao Paulo' },
        existingAbbreviations: ['SP'],
      },
    });
    expect(screen.getByLabelText('Abbreviation')).toHaveValue('SP');
    expect(save()).toBeDisabled();
    await user.type(screen.getByLabelText('Name'), '!');
    expect(save()).toBeEnabled();
  });

  it('is disabled while the parent says a request is in flight', async () => {
    const user = userEvent.setup();
    render(StateForm, { props: { disabled: true } });
    await user.type(screen.getByLabelText('Abbreviation'), 'SP');
    await user.type(screen.getByLabelText('Name'), 'Sao Paulo');
    expect(save()).toBeDisabled();
  });

  it('emits the trimmed, normalised values on submit', async () => {
    const user = userEvent.setup();
    const onSubmitState = vi.fn();
    render(StateForm, { props: { onSubmitState } });
    await user.type(screen.getByLabelText('Abbreviation'), 'sp');
    await user.type(screen.getByLabelText('Name'), '  Sao Paulo  ');
    await user.click(save());
    expect(onSubmitState).toHaveBeenCalledWith({ abbreviation: 'SP', name: 'Sao Paulo' });
  });
});
