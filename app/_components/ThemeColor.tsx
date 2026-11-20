'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function ThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', getComputedStyle(document.body).backgroundColor)
    );
    return () => window.cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  return null;
}
