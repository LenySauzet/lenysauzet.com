import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProjectMedia } from './ProjectMedia';

const probe = { width: 1200, height: 630, placeholder: 'data:image/webp;base64,AAAA' };
const image = 'https://cdn.lenysauzet.com/portfolio/atrean.jpg';

describe('ProjectMedia', () => {
  it('holds the image back over its placeholder until it has loaded', async () => {
    const { container } = render(<ProjectMedia image={image} probe={probe} />);
    const media = container.firstElementChild!;

    expect(media).toHaveAttribute('data-state', 'loading');
    expect(container.querySelector('[style*="background-image"]')).toBeInTheDocument();

    fireEvent.load(container.querySelector('img')!);

    await waitFor(() => expect(media).toHaveAttribute('data-state', 'loaded'));
  });

  it('shows the fallback instead of a broken image', () => {
    const { container } = render(<ProjectMedia image={image} probe={probe} />);

    fireEvent.error(container.querySelector('img')!);

    expect(container.firstElementChild).toHaveAttribute('data-state', 'failed');
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.hatch')).toBeInTheDocument();
  });

  it('plays the video over the still when the project has one', () => {
    const { container } = render(
      <ProjectMedia image={image} video="https://cdn.lenysauzet.com/portfolio/atrean.mp4" probe={probe} />
    );

    expect(container.querySelector('img')).toBeInTheDocument();
    expect(container.querySelector('video source')).toHaveAttribute(
      'src',
      'https://cdn.lenysauzet.com/portfolio/atrean.mp4'
    );
  });
});
