import { hasLocale } from 'next-intl';

import siteConfig from '@/config/site';
import { routing } from '@/i18n/routing';

export async function GET(_: Request, { params }: RouteContext<'/[locale]/resume'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response('Not found', { status: 404 });

  const file = siteConfig.resumes[locale];
  const upstream = await fetch(`${siteConfig.cdnUrl}/files/${file}`);

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
