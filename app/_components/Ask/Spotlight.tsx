'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

const SHINE = (alpha: number) => `oklch(from var(--glare) l c h / ${alpha})`;

interface SpotlightProps {
  x: MotionValue<number>;
  rim: MotionValue<number>;
  flare: MotionValue<number>;
}

export function Spotlight({ x, rim, flare }: SpotlightProps) {
  const left = useTransform(x, (value) => `${value}%`);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
      <motion.span
        className="absolute -top-px h-[2px] w-[42%] -translate-x-1/2"
        style={{ left, opacity: rim, background: `radial-gradient(closest-side, ${SHINE(0.95)}, transparent)` }}
      />
      <motion.span
        className="absolute top-0 h-7 w-[46%] -translate-x-1/2"
        style={{
          left,
          opacity: rim,
          background: `radial-gradient(ellipse 50% 100% at 50% 0%, ${SHINE(0.16)}, transparent)`,
        }}
      />
      <motion.span
        className="absolute top-0 h-6 w-52 -translate-1/2 rounded-full blur-md"
        style={{ left, opacity: flare, background: `radial-gradient(closest-side, ${SHINE(0.5)}, transparent)` }}
      />
      <motion.span
        className="absolute top-0 h-1 w-20 -translate-1/2 rounded-full blur-[1.5px]"
        style={{ left, opacity: flare, background: `radial-gradient(closest-side, ${SHINE(1)}, transparent)` }}
      />
    </div>
  );
}
