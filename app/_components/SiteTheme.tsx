import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme/stored-theme';

export function SiteTheme({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      storageKey={THEME_STORAGE_KEY}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
