import { routing, type Locale } from './routing';

export const otherLocale = (locale: Locale): Locale =>
  routing.locales.find((language) => language !== locale) ?? routing.defaultLocale;

export const versionToOffer = (current: Locale, preferred: readonly string[]): Locale | undefined => {
  const primary = preferred[0]?.split('-')[0]?.toLowerCase();
  const other = otherLocale(current);
  return primary === other ? other : undefined;
};
