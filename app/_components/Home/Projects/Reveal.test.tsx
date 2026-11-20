import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Reveal } from './Reveal';

describe('Reveal', () => {
  it('serves the hidden state even to a reader who reduces motion, as the server cannot know', () => {
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);

    expect(renderToString(<Reveal>Atrean</Reveal>)).toContain('opacity:0');
  });
});
