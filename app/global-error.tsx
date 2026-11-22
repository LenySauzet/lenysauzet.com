'use client';

import { useEffect, useSyncExternalStore } from 'react';

import { routing, type Locale } from '@/i18n/routing';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';

import { bodyClassName } from './_components/document';
import { ErrorBody, type ErrorProps } from './_components/ErrorBody';
import { StoredTheme } from './_components/StoredTheme';
import './globals.css';

const MESSAGES = { en, fr } satisfies Record<Locale, typeof en>;

const unchanging = () => () => {};
const localeOfPage = () =>
  routing.locales.find((locale) => {
    const { pathname } = window.location;
    return locale !== routing.defaultLocale && (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  }) ?? routing.defaultLocale;

export default function GlobalError({ error, retry }: ErrorProps) {
  const locale = useSyncExternalStore(unchanging, localeOfPage, () => routing.defaultLocale);
  const { Status: t } = MESSAGES[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={bodyClassName}>
        <StoredTheme />
        <title>{t.errorHeading}</title>
        <main>
          <ErrorBody
            heading={t.errorHeading}
            message={t.siteFailed}
            home={{ href: locale === routing.defaultLocale ? '/' : `/${locale}`, label: t.home }}
            retryLabel={t.retry}
            retry={retry}
          />
        </main>
      </body>
    </html>
  );
}
