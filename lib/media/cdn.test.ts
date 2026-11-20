import { describe, expect, it } from 'vitest';

import { resolveImage } from './cdn';

describe('resolveImage', () => {
  it('places a bare path under the portfolio folder of the CDN', () => {
    expect(resolveImage('atrean.jpg')).toBe('https://cdn.lenysauzet.com/portfolio/atrean.jpg');
    expect(resolveImage('/atrean.jpg')).toBe('https://cdn.lenysauzet.com/portfolio/atrean.jpg');
  });

  it('leaves an absolute URL alone', () => {
    expect(resolveImage('https://blog.lenysauzet.com/opengraph-image')).toBe(
      'https://blog.lenysauzet.com/opengraph-image'
    );
  });
});
