import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

import { probeImage } from './probe';

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#3b82f6' } })
    .png()
    .toBuffer();

describe('probeImage', () => {
  it('reads the size and draws a tiny placeholder', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Uint8Array(await png(1200, 630))));

    const probe = await probeImage('https://cdn.lenysauzet.com/portfolio/a.png');

    expect(probe).toMatchObject({ width: 1200, height: 630 });
    const tiny = await sharp(Buffer.from(probe.placeholder!.split(',')[1], 'base64')).metadata();
    expect(tiny).toMatchObject({ format: 'webp', width: 16 });
  });

  it('assumes 16:9 with no placeholder rather than failing the build when the image is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not found', { status: 404 }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await probeImage('https://cdn.lenysauzet.com/portfolio/gone.png')).toEqual({ width: 1600, height: 900 });
  });
});
