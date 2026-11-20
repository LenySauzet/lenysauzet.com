export const EASE_OUT = [0.22, 0.61, 0.36, 1] as const;

export const blurred = (radius: number) => ({ opacity: 0, filter: `blur(${radius}px)` });

export const sharp = { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const EASE_SNAP = [0.23, 1, 0.32, 1] as const;

export const rubberBand = (distance: number, limit: number, stiffness = 0.55) =>
  Math.sign(distance) * limit * (1 - 1 / ((Math.abs(distance) / limit) * stiffness + 1));
