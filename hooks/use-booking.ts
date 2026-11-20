'use client';

import { useTheme } from 'next-themes';
import { useCallback } from 'react';

import { openBooking } from '@/lib/services/booking';

export function useBooking() {
  const { resolvedTheme } = useTheme();

  return useCallback(() => openBooking(resolvedTheme), [resolvedTheme]);
}
