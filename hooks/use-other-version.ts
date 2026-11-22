'use client';

import { useLocale } from 'next-intl';
import { useCallback } from 'react';

import { otherVersionOf } from '@/i18n/locales';
import { usePathname } from '@/i18n/navigation';
import { goTo } from '@/lib/browser';

export function useOtherVersion() {
  const target = otherVersionOf(usePathname(), useLocale());

  return useCallback(() => goTo(target), [target]);
}
