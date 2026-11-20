import { EASE_OUT } from '@/lib/motion';

export const MORPH = { type: 'spring', stiffness: 220, damping: 20, mass: 1 } as const;

export const FADE = { duration: 0.34, ease: EASE_OUT } as const;
