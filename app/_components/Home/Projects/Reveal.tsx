'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

const HIDDEN = { opacity: 0, filter: 'blur(12px)', y: 8 };
const SHOWN = { opacity: 1, filter: 'blur(0px)', y: 0, transitionEnd: { filter: 'none' } };

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const still = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={still ? false : HIDDEN}
      whileInView={SHOWN}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
