import type { MetadataRoute } from 'next';

import { homeAlternates, homeUrl } from '@/i18n/locales';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = homeAlternates();
  return routing.locales.map((locale) => ({
    url: homeUrl(locale),
    changeFrequency: 'monthly',
    alternates: { languages },
  }));
}
