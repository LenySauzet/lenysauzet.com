import { EASE_OUT } from '@/lib/motion';

export const MORPH = { type: 'spring', stiffness: 220, damping: 20, mass: 1 } as const;

export const MENTIONS_PALETTE_AFTER = 1400;
export const MENTIONS_PALETTE_FOR = 2400;

export const FADE = { duration: 0.34, ease: EASE_OUT } as const;
