'use client';

import { hasLocale } from 'next-intl';
import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react';

import { homePath } from '@/i18n/locales';
import { routing } from '@/i18n/routing';
import { unchanging } from '@/lib/browser';
import { storedTheme } from '@/lib/theme/stored-theme';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';

import { bodyClassName } from './_components/document';
import { ErrorBody, type ErrorProps } from './_components/ErrorBody';
import './globals.css';

const STATUS = { en: en.Status, fr: fr.Status };

const localeOfPage = () => {
  const segment = window.location.pathname.split('/')[1];
  return hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;
};

export default function GlobalError({ error, retry }: ErrorProps) {
  const locale = useSyncExternalStore(unchanging, localeOfPage, () => routing.defaultLocale);
  const status = STATUS[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  useLayoutEffect(() => {
    const theme = storedTheme();
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, []);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={bodyClassName}>
        <title>{status.errorHeading}</title>
        <main>
          <ErrorBody status={status} message={status.siteFailed} homeHref={homePath(locale)} retry={retry} />
        </main>
      </body>
    </html>
  );
}
