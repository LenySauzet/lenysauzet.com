import type { Locale } from 'next-intl';

import siteConfig from '@/config/site';

import { getPathname } from './navigation';
import { routing } from './routing';

export const CONTENT_LOCALE: Locale = 'en';

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = { en: 'en_US', fr: 'fr_FR' };

export const SPEECH_LOCALES: Record<Locale, string> = { en: 'en-US', fr: 'fr-FR' };

export const otherLocale = (locale: Locale): Locale =>
  routing.locales.find((language) => language !== locale) ?? routing.defaultLocale;

export const homePath = (locale: Locale) => getPathname({ href: '/', locale });

export const homeUrl = (locale: Locale) => {
  const path = homePath(locale);
  return path === '/' ? siteConfig.url : `${siteConfig.url}${path}`;
};

export const homeAlternates = () => ({
  ...Object.fromEntries(routing.locales.map((locale) => [locale, homeUrl(locale)])),
  'x-default': homeUrl(routing.defaultLocale),
});

export const otherVersionOf = (pathname: string, locale: Locale) =>
  getPathname({ href: pathname, locale: otherLocale(locale) });

export const versionToOffer = (current: Locale, preferred: readonly string[]): Locale | undefined => {
  const primary = preferred[0]?.split('-')[0]?.toLowerCase();
  const other = otherLocale(current);
  return primary === other ? other : undefined;
};
