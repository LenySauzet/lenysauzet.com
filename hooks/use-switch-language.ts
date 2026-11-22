'use client';

import { useLocale } from 'next-intl';
import { useCallback } from 'react';

import { otherVersionOf } from '@/i18n/locales';
import { usePathname } from '@/i18n/navigation';

export function useSwitchLanguage() {
  const target = otherVersionOf(usePathname(), useLocale());

  return useCallback(() => window.location.assign(target), [target]);
}
