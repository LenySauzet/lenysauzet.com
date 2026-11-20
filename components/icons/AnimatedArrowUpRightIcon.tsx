'use client';

import { motion, type Variants } from 'motion/react';

import { useIconControls, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { EASE_SNAP } from '@/lib/motion';

const arrow: Variants = {
  normal: { transform: 'translate(0px, 0px) scale(1)' },
  animate: {
    transform: [
      'translate(0px, 0px) scale(1)',
      'translate(2.1px, -2.1px) scale(0.97)',
      'translate(-0.25px, 0.25px) scale(1.01)',
      'translate(0.4px, -0.4px) scale(0.995)',
      'translate(0px, 0px) scale(1)',
    ],
    transition: { duration: 0.5, ease: EASE_SNAP },
  },
};

export function AnimatedArrowUpRightIcon({ ref, className }: AnimatedIconProps) {
  const controls = useIconControls(ref);

  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" overflow="visible" className={className}>
      <motion.g
        variants={arrow}
        animate={controls}
        initial="normal"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        style={{ transformBox: 'view-box', originX: 0.5, originY: 0.5 }}
      >
        <path d="M16.5 7.5L6.5 17.5" />
        <path d="M9 6.65032C9 6.65032 15.9383 6.10759 16.9154 7.08463C17.8924 8.06167 17.3496 15 17.3496 15" />
      </motion.g>
    </svg>
  );
}
