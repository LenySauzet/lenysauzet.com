'use client';

import { useEffect, useLayoutEffect } from 'react';

import { storedTheme } from '@/lib/theme/stored-theme';

import { bodyClassName } from './_components/document';
import { ErrorBody, type ErrorProps } from './_components/ErrorBody';
import './globals.css';

export default function GlobalError({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  useLayoutEffect(() => {
    const theme = storedTheme();
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <title>Something went wrong</title>
        <main>
          <ErrorBody subject="The site" retry={retry} />
        </main>
      </body>
    </html>
  );
}
