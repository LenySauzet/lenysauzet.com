'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

const SHINE = (alpha: number) => `oklch(from var(--glare) l c h / ${alpha})`;

interface SpotlightProps {
  x: MotionValue<number>;
  rim: MotionValue<number>;
}

export function Spotlight({ x, rim }: SpotlightProps) {
  const left = useTransform(x, (value) => `${value}%`);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
      <motion.span
        className="absolute top-0 h-px w-[42%] -translate-x-1/2"
        style={{ left, opacity: rim, background: `radial-gradient(closest-side, ${SHINE(0.95)}, transparent)` }}
      />
    </div>
  );
}
