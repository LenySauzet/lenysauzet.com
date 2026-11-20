export const focusRing =
  'outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const pillSurface = `glass-rim relative inline-flex h-11 items-center rounded-xl bg-card shadow-(--shadow-pill) transition-[scale] duration-200 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${focusRing}`;

export const pageGrid =
  'grid grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[6rem_minmax(2rem,1fr)_minmax(0,44rem)_minmax(2rem,1fr)_6rem] lg:px-20';
