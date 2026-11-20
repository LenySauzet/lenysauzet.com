import { describe, expect, it, vi } from 'vitest';

import { measureImage } from './measure';

const PNG_1200x630 = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x04,
  0xb0, 0x00, 0x00, 0x02, 0x76, 0x08, 0x06, 0x00, 0x00, 0x00,
]);

describe('measureImage', () => {
  it('reads the size from the image header', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(PNG_1200x630));

    expect(await measureImage('https://cdn.lenysauzet.com/portfolio/a.png')).toEqual({ width: 1200, height: 630 });
  });

  it('assumes 16:9 rather than failing the build when the image is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not found', { status: 404 }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await measureImage('https://cdn.lenysauzet.com/portfolio/gone.png')).toEqual({ width: 1600, height: 900 });
  });
});
