'use client';

import { motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useRef, type CSSProperties } from 'react';

import { blurred, EASE_OUT, sharp } from '@/lib/motion';
import { hueOf } from '@/lib/presence/hue';
import { GHOSTS } from '@/lib/presence/pose';
import { cn } from '@/lib/utils';

import type { Ink } from './remote-cursors';

interface Shape {
  path: string;
  stroke: number;
  rimStroke: number;
}

const ARROW: Shape = { path: 'M4.5 4L21.5 10.6L13.6 13.3L10.9 21.2Z', stroke: 3.5, rimStroke: 6 };
const HAND: Shape = {
  path: 'M7.4 11V4.4a1.1 1.1 0 0 1 2.2 0V11ZM10.75 11V1.8a1.1 1.1 0 0 1 2.2 0V11ZM14.1 11V3.2a1.1 1.1 0 0 1 2.2 0V11ZM17.45 11V6.4a1.1 1.1 0 0 1 2.2 0V11ZM7.4 9H19.65V15.3A6.2 6.2 0 0 1 13.45 21.5Q10.64 21.5 9.1 20L2.6 13.8A1.6 1.6 0 0 1 3.6 10.9L6.1 12.25Q7.4 13 7.4 11.4Z',
  stroke: 0.4,
  rimStroke: 2.9,
};
const GONE = { ...blurred(6), scale: 0.6 };
const HERE = { ...sharp, scale: 1 };
const FADED = { opacity: 0 };
const SHOWN = { opacity: 1 };
const MARK_SIZE = 20;
const PLACED = 'absolute top-0 left-0 origin-top-left will-change-transform';
const POSED = 'absolute top-0 left-0 [rotate:var(--turn,0deg)] [scale:var(--press,1)]';
const HAND_CENTRE = 'origin-[8px_8.5px]';
const ON_POINTER =
  'transition-[translate] duration-200 ease-out motion-reduce:transition-none group-data-hand/ink:-translate-x-[8px] group-data-hand/ink:-translate-y-[8.5px]';
const SWAP =
  'origin-center drop-shadow-md transition-[opacity,scale,filter,visibility] duration-200 ease-out motion-reduce:transition-none';

interface MarkProps {
  shape: Shape;
  filter: string;
  rimmed?: boolean;
  className?: string;
}

function Mark({ shape: { path, stroke, rimStroke }, filter, rimmed = false, className }: MarkProps) {
  return (
    <svg width={MARK_SIZE} height={MARK_SIZE} viewBox="0 0 26 26" overflow="visible" className={className}>
      <g filter={`url(#${filter})`} strokeLinejoin="round">
        {rimmed && <path d={path} strokeWidth={rimStroke} className="fill-white stroke-white" />}
        <path d={path} strokeWidth={stroke} className="fill-cursor stroke-cursor" />
      </g>
    </svg>
  );
}

interface CursorProps {
  id: string;
  attach: (id: string, ink: Ink | null) => void;
  className?: string;
}

export const Cursor = memo(function Cursor({ id, attach, className }: CursorProps) {
  const still = useReducedMotion();
  const filter = `${id}-motion`;
  const main = useRef<HTMLDivElement>(null);
  const ghosts = useRef<(HTMLDivElement | null)[]>([]);
  const blur = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    if (!main.current) return;
    attach(id, {
      main: main.current,
      ghosts: ghosts.current.filter((ghost): ghost is HTMLDivElement => ghost !== null),
      blur: blur.current,
    });
    return () => attach(id, null);
  }, [attach, id, still]);

  return (
    <div className={cn('absolute inset-0', className)} style={{ '--cursor-hue': hueOf(id) } as CSSProperties}>
      <svg aria-hidden className="absolute size-0">
        <filter id={filter} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur ref={blur} stdDeviation="0 0" />
        </filter>
      </svg>
      {!still && (
        <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {Array.from({ length: GHOSTS }, (_, index) => (
            <div
              key={index}
              ref={(ghost) => {
                ghosts.current[index] = ghost;
              }}
              className={cn(PLACED, 'opacity-0 data-hand:hidden')}
            >
              <Mark shape={ARROW} filter={filter} />
            </div>
          ))}
        </motion.div>
      )}
      <div ref={main} className={cn(PLACED, 'group/ink invisible')}>
        <motion.div
          initial={still ? FADED : GONE}
          animate={still ? SHOWN : HERE}
          exit={still ? FADED : GONE}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="origin-top-left"
        >
          <div className={ON_POINTER}>
            <div className={cn(POSED, 'origin-top-left')}>
              <Mark
                shape={ARROW}
                filter={filter}
                rimmed
                className={cn(
                  SWAP,
                  'blur-[0px] group-data-hand/ink:invisible group-data-hand/ink:scale-50 group-data-hand/ink:opacity-0 group-data-hand/ink:blur-[3px]'
                )}
              />
            </div>
            <div className={cn(POSED, HAND_CENTRE)}>
              <Mark
                shape={HAND}
                filter={filter}
                rimmed
                className={cn(
                  SWAP,
                  'invisible scale-50 opacity-0 blur-[3px]',
                  'group-data-hand/ink:visible group-data-hand/ink:scale-100 group-data-hand/ink:opacity-100 group-data-hand/ink:blur-[0px]'
                )}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});
