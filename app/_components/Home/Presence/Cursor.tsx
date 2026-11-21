'use client';

import { motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useRef, type CSSProperties } from 'react';

import { blurred, EASE_OUT, sharp } from '@/lib/motion';
import { HAND_RIM_STROKE, HAND_SHAPES, HAND_STROKE, HAND_VIEW, handShapeProps } from '@/lib/presence/hand';
import { hueOf } from '@/lib/presence/hue';
import { GHOSTS } from '@/lib/presence/pose';
import { cn } from '@/lib/utils';

import type { Ink } from './remote-cursors';

const ARROW = 'M4.5 4L21.5 10.6L13.6 13.3L10.9 21.2Z';
const GONE = { ...blurred(6), scale: 0.6 };
const HERE = { ...sharp, scale: 1 };
const FADED = { opacity: 0 };
const SHOWN = { opacity: 1 };
const PLACED = 'absolute top-0 left-0 origin-top-left will-change-transform';
const SWAP = 'transition-[opacity,scale] duration-150 ease-out motion-reduce:transition-none';
const HAND_SIZE = 22;

interface ArrowProps {
  filter: string;
  rimmed?: boolean;
  className?: string;
}

function Arrow({ filter, rimmed = false, className }: ArrowProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" overflow="visible" className={className}>
      <g filter={`url(#${filter})`} strokeLinejoin="round">
        {rimmed && <path d={ARROW} strokeWidth="6" className="fill-white stroke-white" />}
        <path d={ARROW} strokeWidth="3.5" className="fill-cursor stroke-cursor" />
      </g>
    </svg>
  );
}

interface HandProps {
  className?: string;
}

function Hand({ className }: HandProps) {
  const shapes = (stroke: number, color: string) =>
    HAND_SHAPES.map((shape, index) => (
      <rect key={index} {...handShapeProps(shape)} strokeWidth={stroke} className={color} />
    ));

  return (
    <svg
      width={HAND_SIZE}
      height={HAND_SIZE}
      viewBox={`0 0 ${HAND_VIEW} ${HAND_VIEW}`}
      overflow="visible"
      className={className}
    >
      <g strokeLinejoin="round">
        {shapes(HAND_RIM_STROKE, 'fill-white stroke-white')}
        {shapes(HAND_STROKE, 'fill-cursor stroke-cursor')}
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
              <Arrow filter={filter} />
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
          <Arrow
            filter={filter}
            rimmed
            className={cn(
              SWAP,
              'origin-top-left drop-shadow-md group-data-hand/ink:scale-50 group-data-hand/ink:opacity-0 motion-reduce:scale-100'
            )}
          />
          <Hand
            className={cn(
              SWAP,
              'absolute top-0 left-0 -translate-1/2 scale-50 opacity-0 drop-shadow-md motion-reduce:scale-100',
              'group-data-hand/ink:scale-100 group-data-hand/ink:opacity-100'
            )}
          />
        </motion.div>
      </div>
    </div>
  );
});
