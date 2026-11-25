'use client';

import { motion, type Variants } from 'motion/react';

import { useIconControls, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { EASE_SNAP } from '@/lib/motion';

const DURATION = 0.7;

const capsule: Variants = {
  normal: { y: 0, scaleX: 1, scaleY: 1 },
  animate: {
    y: [0, -1.6, 0.5, 0],
    scaleX: [1, 0.96, 1.03, 1],
    scaleY: [1, 1.04, 0.97, 1],
    transition: { duration: DURATION, ease: EASE_SNAP, times: [0, 0.3, 0.62, 1] },
  },
};

const wave = (side: -1 | 1): Variants => ({
  normal: { pathLength: 0, opacity: 0, x: 0 },
  animate: {
    pathLength: [0, 1, 1],
    opacity: [0, 1, 0],
    x: [0, side * 0.6, side * 1.6],
    transition: { duration: DURATION, ease: 'easeOut', times: [0, 0.4, 1], delay: 0.08 },
  },
});

export function AnimatedMicIcon({ ref, className }: AnimatedIconProps) {
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
        d="M8 6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11V6Z"
        variants={capsule}
        animate={controls}
        initial="normal"
        style={{ transformBox: 'view-box', originX: 0.5, originY: 15 / 24 }}
      />
      <path d="M12 18V22M12 18H11.5208C8.11765 18 5.28262 15.3914 5 12M12 18H12.4792C15.8824 18 18.7174 15.3914 19 12M12 22H15M12 22H9" />
      <motion.path d="M4.6 4.6C3.8 6.1 3.8 8.4 4.6 9.9" variants={wave(-1)} animate={controls} initial="normal" />
      <motion.path d="M19.4 4.6C20.2 6.1 20.2 8.4 19.4 9.9" variants={wave(1)} animate={controls} initial="normal" />
    </svg>
  );
}
