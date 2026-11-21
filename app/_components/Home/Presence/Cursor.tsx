'use client';

import { motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useRef, type CSSProperties } from 'react';

import { blurred, EASE_OUT, sharp } from '@/lib/motion';
import { hueOf } from '@/lib/presence/hue';
import { GHOSTS } from '@/lib/presence/pose';
import { cn } from '@/lib/utils';

import { MARK_SIZE, type Ink } from './remote-cursors';

interface Shape {
  path: string;
  ink: number;
  rim: number;
}

const ARROW: Shape = { path: 'M4.5 4L21.5 10.6L13.6 13.3L10.9 21.2Z', ink: 3.5, rim: 6 };
const HAND: Shape = {
  path: 'M9.4 13V6.4a1.1 1.1 0 0 1 2.2 0V13ZM12.75 13V3.8a1.1 1.1 0 0 1 2.2 0V13ZM16.1 13V5.2a1.1 1.1 0 0 1 2.2 0V13ZM19.45 13V8.4a1.1 1.1 0 0 1 2.2 0V13ZM9.4 11H21.65V17.3A6.2 6.2 0 0 1 15.45 23.5Q12.64 23.5 11.1 22L4.6 15.8A1.6 1.6 0 0 1 5.6 12.9L8.1 14.25Q9.4 15 9.4 13.4Z',
  ink: 0.4,
  rim: 2.9,
};
const GONE = { ...blurred(6), scale: 0.6 };
const HERE = { ...sharp, scale: 1 };
const FADED = { opacity: 0 };
const SHOWN = { opacity: 1 };
const PLACED = 'absolute top-0 left-0 origin-top-left will-change-transform';
const SWAP =
  'origin-center drop-shadow-md transition-[opacity,scale,filter] duration-200 ease-out motion-reduce:transition-none';

interface MarkProps {
  shape: Shape;
  filter: string;
  rimmed?: boolean;
  className?: string;
}

function Mark({ shape: { path, ink, rim }, filter, rimmed = false, className }: MarkProps) {
  return (
    <svg width={MARK_SIZE} height={MARK_SIZE} viewBox="0 0 26 26" overflow="visible" className={className}>
      <g filter={`url(#${filter})`} strokeLinejoin="round">
        {rimmed && <path d={path} strokeWidth={rim} className="fill-white stroke-white" />}
        <path d={path} strokeWidth={ink} className="fill-cursor stroke-cursor" />
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
          <Mark
            shape={ARROW}
            filter={filter}
            rimmed
            className={cn(
              SWAP,
              'blur-[0px] group-data-hand/ink:scale-50 group-data-hand/ink:opacity-0 group-data-hand/ink:blur-[3px]'
            )}
          />
          <Mark
            shape={HAND}
            filter={filter}
            rimmed
            className={cn(
              SWAP,
              'absolute inset-0 scale-50 opacity-0 blur-[3px]',
              'group-data-hand/ink:scale-100 group-data-hand/ink:opacity-100 group-data-hand/ink:blur-[0px]'
            )}
          />
        </motion.div>
      </div>
    </div>
  );
});
