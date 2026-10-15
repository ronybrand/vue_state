import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog.vue';

function setup() {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(ConfirmDialog, {
    props: { message: 'Delete SP?', onConfirm, onCancel },
  });
  const dialog = utils.container.querySelector('dialog')!;
  return { ...utils, dialog, onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('is closed until open() is called on the exposed handle', () => {
    const { dialog } = setup();
    expect(dialog).not.toHaveAttribute('open');
  });

  it('is labelled by its message', () => {
    setup();
    expect(screen.getByLabelText('Delete SP?', { selector: 'dialog' })).toBeInTheDocument();
  });

  it('emits confirm and closes', async () => {
    const { dialog, onConfirm } = setup();
    dialog.setAttribute('open', '');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(dialog).not.toHaveAttribute('open');
  });

  it('emits cancel and closes', async () => {
    const { dialog, onCancel } = setup();
    dialog.setAttribute('open', '');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(dialog).not.toHaveAttribute('open');
  });

  it('emits cancel when dismissed natively (Escape fires the cancel event)', () => {
    const { dialog, onCancel } = setup();
    dialog.dispatchEvent(new Event('cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
