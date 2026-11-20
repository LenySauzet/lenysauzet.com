'use client';

import { motion, type Variants } from 'motion/react';

import { useIconControls, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { EASE_SNAP } from '@/lib/motion';

const arrow: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2.4, 1.8, -0.35, 0],
    transition: { duration: 0.6, ease: EASE_SNAP, times: [0, 0.14, 0.54, 0.8, 1] },
  },
};

const tray: Variants = {
  normal: { y: 0, scaleY: 1 },
  animate: {
    y: [0, 0, 0.7, 0],
    scaleY: [1, 1, 0.96, 1],
    transition: { duration: 0.6, ease: EASE_SNAP, times: [0, 0.46, 0.66, 1] },
  },
};

export function AnimatedDownloadIcon({ ref, className }: AnimatedIconProps) {
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
      <motion.path
        d="M2.99969 17.0002C2.99969 17.9302 2.99969 18.3952 3.10192 18.7767C3.37932 19.8119 4.18796 20.6206 5.22324 20.898C5.60474 21.0002 6.06972 21.0002 6.99969 21.0002L16.9997 21.0002C17.9297 21.0002 18.3947 21.0002 18.7762 20.898C19.8114 20.6206 20.6201 19.8119 20.8975 18.7767C20.9997 18.3952 20.9997 17.9302 20.9997 17.0002"
        variants={tray}
        animate={controls}
        initial="normal"
        style={{ transformBox: 'view-box', originX: 0.5, originY: 19 / 24 }}
      />
      <motion.path
        d="M16.4998 11.5002C16.4998 11.5002 13.1856 16.0002 11.9997 16.0002C10.8139 16.0002 7.49976 11.5002 7.49976 11.5002M11.9997 15.0002V3.00016"
        variants={arrow}
        animate={controls}
        initial="normal"
      />
    </svg>
  );
}
