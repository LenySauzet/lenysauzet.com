'use client';

import { motion, type Easing, type Variants } from 'motion/react';
import { useId } from 'react';

import { useIconControls, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { EASE_SNAP } from '@/lib/motion';

const FRONT =
  'M9 15C9 12.1716 9 10.7574 9.87868 9.87868C10.7574 9 12.1716 9 15 9L16 9C18.8284 9 20.2426 9 21.1213 9.87868C22 10.7574 22 12.1716 22 15V16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H15C12.1716 22 10.7574 22 9.87868 21.1213C9 20.2426 9 18.8284 9 16L9 15Z';
const REAR =
  'M16.9999 9C16.9975 6.04291 16.9528 4.51121 16.092 3.46243C15.9258 3.25989 15.7401 3.07418 15.5376 2.90796C14.4312 2 12.7875 2 9.5 2C6.21252 2 4.56878 2 3.46243 2.90796C3.25989 3.07417 3.07418 3.25989 2.90796 3.46243C2 4.56878 2 6.21252 2 9.5C2 12.7875 2 14.4312 2.90796 15.5376C3.07417 15.7401 3.25989 15.9258 3.46243 16.092C4.51121 16.9528 6.04291 16.9975 9 16.9999';

const DURATION = 0.86;
const TIMES = [0, 0.1, 0.34, 0.46, 0.56, 0.76, 0.88, 1];
const EASES: Easing[] = [
  EASE_SNAP,
  [0.77, 0, 0.175, 1],
  EASE_SNAP,
  'linear',
  [0.77, 0, 0.175, 1],
  EASE_SNAP,
  EASE_SNAP,
];
const TIMING = { duration: DURATION, ease: EASES, times: TIMES };
const LIFT = [
  'translate(0px, 0px) scale(1)',
  'translate(0.45px, 0.45px) scale(0.97)',
  'translate(-6.2px, -6.2px) scale(1.2)',
  'translate(-6px, -6px) scale(1.14)',
  'translate(-6px, -6px) scale(1.14)',
  'translate(0.65px, 0.65px) scale(0.96)',
  'translate(-0.25px, -0.25px) scale(1.03)',
  'translate(0px, 0px) scale(1)',
];

const front: Variants = {
  normal: { transform: LIFT[0], strokeWidth: 1.5 },
  animate: {
    transform: LIFT,
    strokeWidth: [1.5, 1.5 / 0.97, 1.5 / 1.2, 1.5 / 1.14, 1.5 / 1.14, 1.5 / 0.96, 1.5 / 1.03, 1.5],
    transition: TIMING,
  },
};

const cover: Variants = {
  normal: { transform: LIFT[0] },
  animate: {
    transform: [
      LIFT[0],
      LIFT[1],
      'translate(-6.2px, -6.2px) scale(1.24)',
      'translate(-6px, -6px) scale(1.18)',
      'translate(-6px, -6px) scale(1.18)',
      'translate(0.65px, 0.65px) scale(1.06)',
      LIFT[6],
      LIFT[7],
    ],
    transition: TIMING,
  },
};

const overlapping: Variants = {
  normal: { visibility: 'hidden' },
  animate: { visibility: ['visible', 'visible', 'hidden'], transition: { duration: DURATION, times: [0, 0.999, 1] } },
};

const SHEET = { transformBox: 'view-box', originX: 15.5 / 24, originY: 15.5 / 24 } as const;

export function AnimatedCopyIcon({ ref, className }: AnimatedIconProps) {
  const controls = useIconControls(ref);
  const mask = `${useId().replace(/[^\w-]/g, '')}-cover`;

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
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32">
          <rect x="-4" y="-4" width="32" height="32" fill="white" stroke="none" />
          <motion.g variants={overlapping} animate={controls} initial="normal">
            <motion.path
              d={FRONT}
              fill="black"
              stroke="black"
              strokeWidth="2.5"
              variants={cover}
              animate={controls}
              initial="normal"
              style={SHEET}
            />
          </motion.g>
        </mask>
      </defs>
      <motion.path d={FRONT} variants={front} animate={controls} initial="normal" style={SHEET} />
      <path d={REAR} mask={`url(#${mask})`} />
    </svg>
  );
}
