type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
export const DEFAULT_THEME: Theme = 'dark';

export const themeOf = (stored: string | null, prefersLight: boolean): Theme =>
  stored === 'light' || (stored === 'system' && prefersLight) ? 'light' : DEFAULT_THEME;

export function storedTheme(): Theme {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {}
  return themeOf(stored, window.matchMedia('(prefers-color-scheme: light)').matches);
}
