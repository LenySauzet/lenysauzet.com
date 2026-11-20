import { flushSync } from 'react-dom';

import { prefersReducedMotion } from '@/lib/motion';

export function withThemeTransition(change: () => void) {
  if (prefersReducedMotion() || !document.startViewTransition) {
    change();
    return;
  }

  document.startViewTransition(() => flushSync(change));
}
