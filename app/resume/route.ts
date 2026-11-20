import siteConfig from '@/config/site';

const { file, url } = siteConfig.resume;

export async function GET() {
  const upstream = await fetch(url);

  if (!upstream.ok || !upstream.body) {
    return new Response('Resume unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }

  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${file}"`,
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
  });
  const length = upstream.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);

  return new Response(upstream.body, { headers });
}
