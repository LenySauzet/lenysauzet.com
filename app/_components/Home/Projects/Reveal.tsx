'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { blurred, EASE_OUT, sharp } from '@/lib/motion';

const ENTRANCE = { duration: 0.9, ease: EASE_OUT };
const AT_ONCE = { duration: 0 };

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const still = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={blurred(12)}
      whileInView={sharp}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={still ? AT_ONCE : ENTRANCE}
    >
      {children}
    </motion.div>
  );
}
