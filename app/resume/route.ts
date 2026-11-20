import siteConfig from '@/config/site';

const FILENAME = siteConfig.resumeUrl.split('/').pop() ?? 'resume.pdf';

export async function GET() {
  const upstream = await fetch(siteConfig.resumeUrl);

  if (!upstream.ok || !upstream.body) {
    return new Response('Resume unavailable', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${FILENAME}"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
