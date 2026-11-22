'use client';

import { hasLocale } from 'next-intl';
import { useEffect, useSyncExternalStore } from 'react';

import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';

import { bodyClassName } from './_components/document';
import { ErrorBody, type ErrorProps } from './_components/ErrorBody';
import { StoredTheme } from './_components/StoredTheme';
import './globals.css';

const STATUS = { en: en.Status, fr: fr.Status } satisfies Record<Locale, typeof en.Status>;

const unchanging = () => () => {};
const localeOfPage = () => {
  const segment = window.location.pathname.split('/')[1];
  return hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;
};

export default function GlobalError({ error, retry }: ErrorProps) {
  const locale = useSyncExternalStore(unchanging, localeOfPage, () => routing.defaultLocale);
  const t = STATUS[locale];

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
            home={{ href: getPathname({ href: '/', locale }), label: t.home }}
            retryLabel={t.retry}
            retry={retry}
          />
        </main>
      </body>
    </html>
  );
}
