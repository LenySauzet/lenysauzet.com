'use client';

import { motion, type Variants } from 'motion/react';
import { useId } from 'react';

import { useIconControls, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { EASE_SNAP } from '@/lib/motion';

const DURATION = 0.94;

const FLAP_CLOSED = 'M2 6L8.91302 9.91697C11.4616 11.361 12.5384 11.361 15.087 9.91697L22 6';
const FLAP_EDGE_ON = 'M2 6L8.91302 6.55C11.4616 6.8 12.5384 6.8 15.087 6.55L22 6';
const FLAP_OPEN = 'M2 6L8.91302 1.6C11.4616 -0.05 12.5384 -0.05 15.087 1.6L22 6';
const FLAP_OPEN_OVERSHOOT = 'M2 6L8.91302 1.25C11.4616 -0.45 12.5384 -0.45 15.087 1.25L22 6';
const FLAP_CLOSED_OVERSHOOT = 'M2 6L8.91302 10.15C11.4616 11.65 12.5384 11.65 15.087 10.15L22 6';
const REAR_EDGE =
  'M3.24496 4.79066C4.37608 3.65523 5.95033 3.61568 9.09882 3.53656C11.0393 3.48781 12.9607 3.48781 14.9012 3.53657C18.0497 3.61568 19.6239 3.65523 20.7551 4.79066';
const ENTRY_LINE = 'M5.2 7.4C8.7 9.1 15.3 9.1 18.8 7.4';
const BODY =
  'M2.01577 13.4756C2.08114 16.5412 2.11383 18.0739 3.24496 19.2094C4.37608 20.3448 5.95033 20.3843 9.09883 20.4634C11.0393 20.5122 12.9607 20.5122 14.9012 20.4634C18.0497 20.3843 19.6239 20.3448 20.7551 19.2094C21.8862 18.0739 21.9189 16.5412 21.9842 13.4756C22.0053 12.4899 22.0053 11.5101 21.9842 10.5244C21.9189 7.45886 21.8862 5.92609 20.7551 4.79066C19.6239 3.65523 18.0497 3.61568 14.9012 3.53657C12.9607 3.48781 11.0393 3.48781 9.09882 3.53656C5.95033 3.61566 4.37608 3.65521 3.24495 4.79065C2.11382 5.92608 2.08114 7.45885 2.01576 10.5244C1.99474 11.5101 1.99475 12.4899 2.01577 13.4756Z';

const flap: Variants = {
  normal: { d: FLAP_CLOSED },
  animate: {
    d: [
      FLAP_CLOSED,
      FLAP_EDGE_ON,
      FLAP_OPEN,
      FLAP_OPEN_OVERSHOOT,
      FLAP_OPEN,
      FLAP_OPEN,
      FLAP_EDGE_ON,
      FLAP_CLOSED_OVERSHOOT,
      FLAP_CLOSED,
    ],
    transition: {
      duration: DURATION,
      ease: [0.77, 0, 0.175, 1],
      times: [0, 0.13, 0.28, 0.38, 0.5, 0.62, 0.76, 0.9, 1],
    },
  },
};

const body: Variants = {
  normal: { transform: 'translateY(0px) scaleX(1) scaleY(1)' },
  animate: {
    transform: [
      'translateY(0px) scaleX(1) scaleY(1)',
      'translateY(0px) scaleX(1) scaleY(1)',
      'translateY(0.12px) scaleX(1.008) scaleY(0.992)',
      'translateY(0.45px) scaleX(1.035) scaleY(0.958)',
      'translateY(-0.32px) scaleX(0.985) scaleY(1.022)',
      'translateY(0.12px) scaleX(1.008) scaleY(0.994)',
      'translateY(0px) scaleX(1) scaleY(1)',
    ],
    transition: { duration: DURATION, ease: EASE_SNAP, times: [0, 0.28, 0.38, 0.5, 0.68, 0.84, 1] },
  },
};

const rearEdgeHidden: Variants = {
  normal: { visibility: 'hidden' },
  animate: {
    visibility: ['hidden', 'hidden', 'visible', 'visible', 'hidden', 'hidden'],
    transition: { duration: DURATION, ease: 'linear', times: [0, 0.26, 0.27, 0.66, 0.67, 1] },
  },
};

export function AnimatedMailIcon({ ref, className }: AnimatedIconProps) {
  const controls = useIconControls(ref);
  const id = useId().replace(/[^\w-]/g, '');
  const rearEdgeMask = `${id}-rear-edge`;
  const flapMask = `${id}-flap`;

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
        <mask id={rearEdgeMask} x="0" y="0" width="24" height="24" maskUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="white" stroke="none" />
          <motion.path
            d={REAR_EDGE}
            stroke="black"
            strokeWidth="2.2"
            variants={rearEdgeHidden}
            animate={controls}
            initial="normal"
          />
        </mask>
        <mask id={flapMask} x="0" y="0" width="24" height="24" maskUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="white" stroke="none" />
          <motion.path fill="black" stroke="none" variants={flap} animate={controls} initial="normal" />
        </mask>
      </defs>
      <motion.path strokeLinecap="butt" variants={flap} animate={controls} initial="normal" />
      <motion.g
        variants={body}
        animate={controls}
        initial="normal"
        style={{ transformBox: 'view-box', originX: 0.5, originY: 0.5 }}
      >
        <path d={BODY} mask={`url(#${rearEdgeMask})`} />
        <path d={ENTRY_LINE} mask={`url(#${flapMask})`} />
      </motion.g>
    </svg>
  );
}
