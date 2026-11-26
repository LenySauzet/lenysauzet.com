'use client';

import { motion, type Variants } from 'motion/react';

import { useIconControls, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { EASE_SNAP } from '@/lib/motion';

const ring: Variants = {
  normal: { scale: 1 },
  animate: { scale: [1, 0.96, 1.025, 1], transition: { duration: 0.48, ease: EASE_SNAP } },
};

const cross: Variants = {
  normal: { rotate: 0, scale: 1 },
  animate: {
    rotate: [0, -10, 4, 0],
    scale: [1, 0.82, 1.08, 1],
    transition: { duration: 0.42, ease: EASE_SNAP },
  },
};

const CENTRE = { transformBox: 'view-box', originX: 0.5, originY: 0.5 } as const;

export function AnimatedCloseIcon({ ref, className }: AnimatedIconProps) {
  const controls = useIconControls(ref);

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      overflow="visible"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      className={className}
    >
      <motion.circle cx="12" cy="12" r="10" variants={ring} animate={controls} initial="normal" style={CENTRE} />
      <motion.path d="M9 9L15 15M15 9L9 15" variants={cross} animate={controls} initial="normal" style={CENTRE} />
    </svg>
  );
}
