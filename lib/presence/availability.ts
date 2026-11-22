import siteConfig from '@/config/site';
import { routing, type Locale } from '@/i18n/routing';
import { hasFinePointer } from '@/lib/browser';

const supportsPopover = () => 'showPopover' in HTMLElement.prototype;

export function presenceUrl() {
  const { presenceUrl: url, presenceOrigin } = siteConfig;
  if (!url || !supportsPopover()) return undefined;
  return presenceOrigin && window.location.origin !== presenceOrigin ? undefined : url;
}

export const roomUrl = (url: string, locale: Locale) =>
  locale === routing.defaultLocale ? url : `${url.replace(/\/$/, '')}/${locale}`;

export const presenceAvailable = () => hasFinePointer() && presenceUrl() !== undefined;
