'use client';

import { useLocale, useMessages } from 'next-intl';
import { useEffect } from 'react';

import { homePath } from '@/i18n/locales';

import { ErrorBody, type ErrorProps } from '../_components/ErrorBody';

export default function Error({ error, retry }: ErrorProps) {
  const { Status } = useMessages();
  const locale = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <ErrorBody status={Status} message={Status.pageFailed} homeHref={homePath(locale)} retry={retry} />
    </main>
  );
}
