import { describe, expect, it } from 'vitest';

import { resolveMedia } from './cdn';

describe('resolveMedia', () => {
  it('places a bare path under the portfolio folder of the CDN', () => {
    expect(resolveMedia('atrean.jpg')).toBe('https://cdn.lenysauzet.com/portfolio/atrean.jpg');
    expect(resolveMedia('/atrean.jpg')).toBe('https://cdn.lenysauzet.com/portfolio/atrean.jpg');
  });

  it('leaves an absolute URL alone', () => {
    expect(resolveMedia('https://blog.lenysauzet.com/opengraph-image')).toBe(
      'https://blog.lenysauzet.com/opengraph-image'
    );
  });
});
