import { render } from '@testing-library/vue';
import Icon from './Icon.vue';
import { ICON_PATHS } from './iconPaths';

describe('Icon', () => {
  it('draws the named path, hidden from assistive tech, at 16px by default', () => {
    const { container } = render(Icon, { props: { name: 'plus' } });
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg.querySelector('path')).toHaveAttribute('d', ICON_PATHS.plus);
  });

  it('honours size', () => {
    const { container } = render(Icon, { props: { name: 'trash', size: 12 } });
    expect(container.querySelector('svg')).toHaveAttribute('height', '12');
  });
});
