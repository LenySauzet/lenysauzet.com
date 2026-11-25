'use client';

import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

const BUBBLES = [
  { x: -0.18, y: -0.12, hue: 0, delay: 0 },
  { x: 0.2, y: -0.06, hue: 40, delay: 0.25 },
  { x: 0, y: 0.2, hue: -40, delay: 0.5 },
];

export function Orb({ thinking = false, className }: { thinking?: boolean; className?: string }) {
  const still = useReducedMotion();

  return (
    <motion.span
      aria-hidden
      className={cn('relative inline-block size-5 shrink-0', className)}
      animate={thinking && !still ? { rotate: 360 } : { rotate: 0 }}
      transition={thinking ? { duration: 3.2, ease: 'linear', repeat: Infinity } : { duration: 0.6 }}
    >
      {BUBBLES.map(({ x, y, hue, delay }) => (
        <motion.span
          key={hue}
          className="absolute inset-[18%] rounded-full mix-blend-multiply ring-1 ring-foreground/20 dark:mix-blend-plus-lighter"
          style={{
            translate: `${x * 100}% ${y * 100}%`,
            background: `radial-gradient(circle at 35% 30%, oklch(from var(--primary) calc(l + 0.2) c calc(h + ${hue}) / 0.9), oklch(from var(--primary) calc(l - 0.05) c calc(h + ${hue}) / 0.55) 70%)`,
          }}
          animate={thinking && !still ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 1.4, delay, ease: 'easeInOut', repeat: thinking ? Infinity : 0 }}
        />
      ))}
    </motion.span>
  );
}
