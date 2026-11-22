import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import siteConfig from '@/config/site';

import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const requested = await rootParams.locale();
    if (!hasLocale(routing.locales, requested)) notFound();
    locale = requested;
  }

  return {
    locale,
    timeZone: siteConfig.author.timeZone,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
