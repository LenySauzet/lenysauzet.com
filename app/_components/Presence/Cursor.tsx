'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';

import { EASE_OUT } from '@/lib/motion';

const ARROW = 'M3 2.5L18.5 9L11.4 11.2L9.1 18.4Z';
const HUE_SEED = 31;

const hueOf = (id: string) => [...id].reduce((hash, character) => (hash * HUE_SEED + character.charCodeAt(0)) % 360, 0);

const GONE = { opacity: 0, scale: 0.6, filter: 'blur(6px)' };
const HERE = { opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };
const FADED = { opacity: 0 };
const SHOWN = { opacity: 1 };

interface CursorProps {
  id: string;
  attach: (id: string, element: HTMLDivElement | null) => void;
}

export function Cursor({ id, attach }: CursorProps) {
  const still = useReducedMotion();

  return (
    <div
      ref={(element) => attach(id, element)}
      className="invisible absolute top-0 left-0 origin-top-left will-change-transform"
      style={{ '--cursor-hue': hueOf(id) } as CSSProperties}
    >
      <motion.div
        initial={still ? FADED : GONE}
        animate={still ? SHOWN : HERE}
        exit={still ? FADED : GONE}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="origin-top-left"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" overflow="visible" className="drop-shadow-sm">
          <filter id={`${id}-motion`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0 0" />
          </filter>
          <path
            d={ARROW}
            filter={`url(#${id}-motion)`}
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="fill-cursor stroke-background"
          />
        </svg>
      </motion.div>
    </div>
  );
}
