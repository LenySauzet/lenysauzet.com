'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';

import { EASE_OUT } from '@/lib/motion';
import { hueOf } from '@/lib/presence/hue';
import { cn } from '@/lib/utils';

const ARROW = 'M4.5 4L21.5 10.6L13.6 13.3L10.9 21.2Z';
const GONE = { opacity: 0, scale: 0.6, filter: 'blur(6px)' };
const HERE = { opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };
const FADED = { opacity: 0 };
const SHOWN = { opacity: 1 };

interface CursorProps {
  id: string;
  attach: (id: string, element: HTMLDivElement | null) => void;
  className?: string;
}

export function Cursor({ id, attach, className }: CursorProps) {
  const still = useReducedMotion();

  return (
    <div
      ref={(element) => attach(id, element)}
      className={cn('invisible absolute top-0 left-0 origin-top-left transition-opacity duration-700 will-change-transform', className)}
      style={{ '--cursor-hue': hueOf(id) } as CSSProperties}
    >
      <motion.div
        initial={still ? FADED : GONE}
        animate={still ? SHOWN : HERE}
        exit={still ? FADED : GONE}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="origin-top-left"
      >
        <svg width="23" height="23" viewBox="0 0 26 26" overflow="visible" className="drop-shadow-md">
          <filter id={`${id}-motion`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0 0" />
          </filter>
          <path
            d={ARROW}
            filter={`url(#${id}-motion)`}
            strokeWidth="3.5"
            strokeLinejoin="round"
            className="fill-cursor stroke-cursor"
          />
        </svg>
      </motion.div>
    </div>
  );
}
