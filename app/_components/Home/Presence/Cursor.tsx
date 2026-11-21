'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';

import { EASE_OUT } from '@/lib/motion';
import { hueOf } from '@/lib/presence/hue';
import { cn } from '@/lib/utils';

import { GHOSTS } from './remote-cursors';

const ARROW = 'M4.5 4L21.5 10.6L13.6 13.3L10.9 21.2Z';
const GONE = { opacity: 0, scale: 0.6, filter: 'blur(6px)' };
const HERE = { opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };
const FADED = { opacity: 0 };
const SHOWN = { opacity: 1 };
const PLACED = 'absolute top-0 left-0 origin-top-left will-change-transform';

interface ArrowProps {
  filter: string;
  rimmed?: boolean;
  className?: string;
}

function Arrow({ filter, rimmed = false, className }: ArrowProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" overflow="visible" className={className}>
      <g filter={`url(#${filter})`} strokeLinejoin="round">
        {rimmed && <path d={ARROW} strokeWidth="6" className="fill-background stroke-background" />}
        <path d={ARROW} strokeWidth="3.5" className="fill-cursor stroke-cursor" />
      </g>
    </svg>
  );
}

interface CursorProps {
  id: string;
  attach: (id: string, element: HTMLElement | null) => void;
  className?: string;
}

export function Cursor({ id, attach, className }: CursorProps) {
  const still = useReducedMotion();
  const filter = `${id}-motion`;

  return (
    <div
      ref={(element) => attach(id, element)}
      className={cn('absolute inset-0', className)}
      style={{ '--cursor-hue': hueOf(id) } as CSSProperties}
    >
      <svg aria-hidden className="absolute size-0">
        <filter id={filter} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0 0" />
        </filter>
      </svg>
      {!still && (
        <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {Array.from({ length: GHOSTS }, (_, index) => (
            <div key={index} data-cursor-ghost className={cn(PLACED, 'opacity-0')}>
              <Arrow filter={filter} />
            </div>
          ))}
        </motion.div>
      )}
      <div data-cursor-main className={cn(PLACED, 'invisible')}>
        <motion.div
          initial={still ? FADED : GONE}
          animate={still ? SHOWN : HERE}
          exit={still ? FADED : GONE}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="origin-top-left"
        >
          <Arrow filter={filter} rimmed className="drop-shadow-md" />
        </motion.div>
      </div>
    </div>
  );
}
