'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';

import { openBooking } from '@/lib/services/booking';

export function useBooking() {
  const { resolvedTheme } = useTheme();
  const t = useTranslations('Commands');

  return useCallback(() => openBooking(resolvedTheme, t('bookingUnreachable')), [resolvedTheme, t]);
}
