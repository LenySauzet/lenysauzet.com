import { EASE_SNAP } from '@/lib/motion';

export { MORPH } from '../../Island/motion';

export const SETTLE = { type: 'spring', stiffness: 260, damping: 34 } as const;
export const NUDGE = { type: 'spring', stiffness: 420, damping: 30 } as const;
export const SNAPPY = { type: 'spring', stiffness: 260, damping: 22, mass: 0.8 } as const;
export const AIM = { type: 'spring', stiffness: 170, damping: 24, mass: 0.6 } as const;
export const EASE_FOLD = [0.45, 0, 0.25, 1] as const;
export const EASE_SWEEP = [0.4, 0, 0.2, 1] as const;
export const GROW = { duration: 0.42, ease: EASE_SNAP } as const;
export const REVEAL = { duration: 0.35 } as const;
export const FOLD = { duration: 0.32, ease: EASE_FOLD } as const;
