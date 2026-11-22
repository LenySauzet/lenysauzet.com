'use client';

import { useLayoutEffect } from 'react';

import { storedTheme } from '@/lib/theme/stored-theme';

export function StoredTheme() {
  useLayoutEffect(() => {
    const theme = storedTheme();
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, []);

  return null;
}
