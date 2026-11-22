'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { otherLocale } from '@/i18n/locales';
import { getPathname, usePathname } from '@/i18n/navigation';

export function useSwitchLanguage() {
  const other = otherLocale(useLocale());
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(() => router.replace(getPathname({ href: pathname, locale: other })), [router, pathname, other]);
}
