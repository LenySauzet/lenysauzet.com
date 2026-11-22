'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { getPathname } from '@/i18n/navigation';

import { ErrorBody, type ErrorProps } from '../_components/ErrorBody';

export default function Error({ error, retry }: ErrorProps) {
  const t = useTranslations('Status');
  const locale = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <ErrorBody
        heading={t('errorHeading')}
        message={t('pageFailed')}
        home={{ href: getPathname({ href: '/', locale }), label: t('home') }}
        retryLabel={t('retry')}
        retry={retry}
      />
    </main>
  );
}
