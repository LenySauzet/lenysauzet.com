import type { MetadataRoute } from 'next';

import siteConfig from '@/config/site';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const homeIn = (locale: Locale) => new URL(getPathname({ href: '/', locale }), siteConfig.url).href;

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, homeIn(locale)])),
    'x-default': homeIn(routing.defaultLocale),
  };

  return routing.locales.map((locale) => ({
    url: homeIn(locale),
    changeFrequency: 'monthly',
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: { languages },
  }));
}
