import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const request = new Request('https://lenysauzet.com/resume');
const get = (locale: string) => GET(request, { params: Promise.resolve({ locale }) });

describe('/resume', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('downloads the resume of the page language, cached at the edge', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('%PDF', { headers: { 'Content-Length': '4' } }));
    vi.stubGlobal('fetch', fetch);

    const response = await get('fr');

    expect(fetch).toHaveBeenCalledWith('https://cdn.lenysauzet.com/files/Leny-Sauzet-CV-fr.pdf');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="Leny-Sauzet-CV-fr.pdf"');
    expect(response.headers.get('Content-Length')).toBe('4');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
  });

  it('never caches a failure, and knows no other language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    const failed = await get('en');
    expect(failed.status).toBe(502);
    expect(failed.headers.get('Cache-Control')).toBe('no-store');
    expect((await get('de')).status).toBe(404);
  });
});
