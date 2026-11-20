import { flushSync } from 'react-dom';

export function withThemeTransition(change: () => void) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition) {
    change();
    return;
  }

  document.startViewTransition(() => flushSync(change));
}
