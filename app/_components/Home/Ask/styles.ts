import type { CSSProperties } from 'react';

import { focusRing } from '@/components/shared/styles';

export const BAR = 44;
export const PANEL_RADIUS = 26;

export const RING = {
  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  maskComposite: 'exclude',
  WebkitMaskComposite: 'xor',
} as const;

export const glass = (blur: string): CSSProperties =>
  ({
    '--glass-blur': blur,
    backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
  }) as CSSProperties;

export const SHIMMER_TEXT: CSSProperties = {
  backgroundImage:
    'linear-gradient(100deg, transparent calc(var(--sweep) - 18%), var(--foreground) var(--sweep), transparent calc(var(--sweep) + 18%)), linear-gradient(var(--subtle-foreground), var(--subtle-foreground))',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

export const BUBBLE_RIM: CSSProperties = {
  ...RING,
  background:
    'radial-gradient(ellipse 60% 140% at 22% 0%, oklch(from var(--glare) l c h / 0.3), transparent), oklch(from var(--foreground) l c h / 0.1)',
};

export const glassButton = `cursor-pointer bg-foreground/[0.06] text-foreground/85 shadow-[inset_0_1px_0_oklch(from_var(--glare)_l_c_h/0.08)] ring-1 ring-foreground/15 transition-[background-color,color,scale] ring-inset hover:bg-foreground/10 hover:text-foreground active:scale-95 disabled:cursor-default disabled:opacity-40 ${focusRing}`;

export const quietButton = `grid cursor-pointer place-items-center rounded-full text-subtle-foreground transition-[color,background-color,scale] hover:bg-foreground/[0.06] hover:text-foreground active:scale-95 ${focusRing}`;
