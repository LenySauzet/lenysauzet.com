'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

const SHINE = (alpha: number) => `oklch(from var(--shine-rim) l c h / ${alpha})`;

const BUBBLE: CSSProperties = {
  background: [
    `radial-gradient(circle at 32% 28%, ${SHINE(0.95)} 0, ${SHINE(0.4)} 12%, transparent 34%)`,
    `radial-gradient(circle at 68% 74%, oklch(from var(--primary) calc(l + 0.3) 0.06 calc(h + 70) / 0.3), transparent 55%)`,
    `radial-gradient(circle at 50% 50%, transparent 55%, ${SHINE(0.14)} 100%)`,
  ].join(', '),
  border: `1px solid ${SHINE(0.55)}`,
  boxShadow: `0 0 14px ${SHINE(0.28)}, inset 0 0 8px ${SHINE(0.22)}`,
};

const DRIFT = [
  { at: { left: '2%', top: '4%' }, x: [0, 3, 0], y: [0, 2, 0] },
  { at: { left: '30%', top: '28%' }, x: [0, -3, 0], y: [0, -2, 0] },
];

export function Orb({ thinking = false, className }: { thinking?: boolean; className?: string }) {
  const still = useReducedMotion() || !thinking;

  return (
    <motion.span
      aria-hidden
      className={cn('relative inline-block size-8 shrink-0', className)}
      animate={still ? { rotate: 0 } : { rotate: 360 }}
      transition={still ? { duration: 0.8 } : { duration: 6, ease: 'linear', repeat: Infinity }}
    >
      {DRIFT.map(({ at, x, y }, index) => (
        <motion.span
          key={index}
          className="absolute size-[68%] rounded-full backdrop-blur-[1px]"
          style={{ ...BUBBLE, ...at }}
          animate={still ? { x: 0, y: 0, scale: 1 } : { x, y, scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, delay: index * 0.6, ease: 'easeInOut', repeat: still ? 0 : Infinity }}
        />
      ))}
    </motion.span>
  );
}
