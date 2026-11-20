'use client';

import { motion, type Variants } from 'motion/react';

import { useIconControls, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { EASE_SNAP } from '@/lib/motion';

const arrow: Variants = {
  normal: { transform: 'translateX(0px) scaleY(1)' },
  animate: {
    transform: [
      'translateX(0px) scaleY(1)',
      'translateX(2.6px) scaleY(0.94)',
      'translateX(-0.3px) scaleY(1.02)',
      'translateX(0.45px) scaleY(0.99)',
      'translateX(0px) scaleY(1)',
    ],
    transition: { duration: 0.5, ease: EASE_SNAP },
  },
};

export function AnimatedArrowRightIcon({ ref, className }: AnimatedIconProps) {
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
        <path d="M18.5 12L4.99997 12" />
        <path d="M13 18C13 18 19 13.5811 19 12C19 10.4188 13 6 13 6" />
      </motion.g>
    </svg>
  );
}
