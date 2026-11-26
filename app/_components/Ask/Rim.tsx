'use client';

import { motion, useMotionTemplate, type MotionValue } from 'motion/react';

export const RING = {
  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  maskComposite: 'exclude',
  WebkitMaskComposite: 'xor',
} as const;

interface RimProps {
  x: MotionValue<number>;
  glow: MotionValue<number>;
}

export function Rim({ x, glow }: RimProps) {
  const background = useMotionTemplate`radial-gradient(ellipse 26% 70% at ${x}% 0%, oklch(from var(--glare) l c h / calc(0.55 * ${glow})), transparent), radial-gradient(ellipse 20% 70% at calc(${x}% + 6%) 100%, oklch(from var(--glare) l c h / calc(0.2 * ${glow})), transparent), oklch(from var(--foreground) l c h / 0.12)`;

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
      style={{ ...RING, background }}
    />
  );
}
