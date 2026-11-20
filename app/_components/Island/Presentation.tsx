'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { blurred, sharp } from '@/lib/motion';

import { FADE } from './motion';

export function Presentation({ children, className }: { children: ReactNode; className?: string }) {
  const still = useReducedMotion();

  return (
    <motion.div
      initial={blurred(10)}
      animate={sharp}
      transition={still ? { duration: 0 } : FADE}
      className={className}
    >
      {children}
    </motion.div>
  );
}
