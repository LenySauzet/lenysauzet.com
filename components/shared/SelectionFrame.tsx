'use client';

import {
  animate,
  motion,
  motionValue,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react';

import { EASE_OUT, rubberBand } from '@/lib/motion';
import { frames } from '@/lib/presence/frames';
import type { Corner } from '@/lib/presence/protocol';
import { cn } from '@/lib/utils';

const STRETCH = 40;
const LET_GO_AFTER = 1500;
const RETURN = { type: 'spring', stiffness: 380, damping: 20 } as const;
const RETURN_STILL = { duration: 0.2, ease: EASE_OUT } as const;
const FOLLOW = { type: 'spring', stiffness: 900, damping: 60 } as const;

type Side = 'left' | 'top' | 'right' | 'bottom';
type Edges = Record<Side, MotionValue<number>>;

const CORNERS: { corner: Corner; x: Side; y: Side; className: string }[] = [
  { corner: 0, x: 'left', y: 'top', className: 'top-0 left-0 -translate-1/2' },
  { corner: 1, x: 'right', y: 'top', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
  { corner: 2, x: 'right', y: 'bottom', className: 'right-0 bottom-0 translate-1/2' },
  { corner: 3, x: 'left', y: 'bottom', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
];

const SIDES: Side[] = ['left', 'top', 'right', 'bottom'];

interface HandleProps {
  frame: string;
  corner: (typeof CORNERS)[number];
  edges: Edges;
  grabbedRef: RefObject<boolean>;
  className?: string;
}

function Handle({ frame, corner, edges, grabbedRef, className }: HandleProps) {
  const still = useReducedMotion();
  const grabbedAt = useRef<{ x: number; y: number } | null>(null);
  const x = edges[corner.x];
  const y = edges[corner.y];

  const grab = (event: PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    for (const side of SIDES) edges[side].stop();
    grabbedRef.current = true;
    grabbedAt.current = { x: event.clientX - x.get(), y: event.clientY - y.get() };
  };

  const pull = (event: PointerEvent<HTMLSpanElement>) => {
    const from = grabbedAt.current;
    if (!from) return;
    x.set(rubberBand(event.clientX - from.x, STRETCH));
    y.set(rubberBand(event.clientY - from.y, STRETCH));
    frames.share({ type: 'pull', pull: { frame, corner: corner.corner, x: x.get(), y: y.get() } });
  };

  const letGo = () => {
    if (!grabbedAt.current) return;
    grabbedAt.current = null;
    grabbedRef.current = false;
    for (const side of SIDES) animate(edges[side], 0, still ? RETURN_STILL : RETURN);
    frames.share({ type: 'drop', frame });
  };

  return (
    <motion.span
      aria-hidden
      onPointerDown={grab}
      onPointerMove={pull}
      onPointerUp={letGo}
      onPointerCancel={letGo}
      style={{ x, y }}
      className={cn(
        'absolute z-10 grid size-6 cursor-grab touch-none place-items-center active:cursor-grabbing',
        className
      )}
    >
      <span className="size-2 border border-primary bg-background" />
    </motion.span>
  );
}

interface SelectionFrameProps {
  name: string;
  children: ReactNode;
  className?: string;
}

export function SelectionFrame({ name, children, className }: SelectionFrameProps) {
  const still = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const padding = useRef({ left: 0, top: 0, right: 0, bottom: 0 });
  const grabbed = useRef(false);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const [edges] = useState<Edges>(() => ({
    left: motionValue(0),
    top: motionValue(0),
    right: motionValue(0),
    bottom: motionValue(0),
  }));
  const { left, top, right, bottom } = edges;

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measured = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const style = getComputedStyle(element);
      padding.current = {
        left: parseFloat(style.paddingLeft),
        top: parseFloat(style.paddingTop),
        right: parseFloat(style.paddingRight),
        bottom: parseFloat(style.paddingBottom),
      };
      width.set(entry.borderBoxSize[0]?.inlineSize ?? element.offsetWidth);
      height.set(entry.borderBoxSize[0]?.blockSize ?? element.offsetHeight);
    });
    measured.observe(element);
    return () => measured.disconnect();
  }, [width, height]);

  useEffect(() => {
    let letGo = 0;
    const settle = (transition: typeof RETURN | typeof RETURN_STILL) => {
      for (const side of SIDES) animate(edges[side], 0, transition);
    };
    const stop = frames.onReceived(name, (event) => {
      if (grabbed.current) return;
      window.clearTimeout(letGo);
      if (event.type === 'drop') return settle(still ? RETURN_STILL : RETURN);
      const corner = CORNERS[event.pull.corner];
      if (!corner) return;
      animate(edges[corner.x], event.pull.x, still ? RETURN_STILL : FOLLOW);
      animate(edges[corner.y], event.pull.y, still ? RETURN_STILL : FOLLOW);
      letGo = window.setTimeout(() => settle(still ? RETURN_STILL : RETURN), LET_GO_AFTER);
    });
    return () => {
      stop();
      window.clearTimeout(letGo);
    };
  }, [edges, name, still]);

  const hatch = useMotionTemplate`inset(calc(${STRETCH}px + ${top}px) calc(${STRETCH}px - ${right}px) calc(${STRETCH}px - ${bottom}px) calc(${STRETCH}px + ${left}px))`;
  const outline = useTransform(
    [width, height, left, top, right, bottom],
    ([w = 0, h = 0, l = 0, t = 0, r = 0, b = 0]: number[]) =>
      `M ${l + 0.5} ${t + 0.5} H ${w + r - 0.5} V ${h + b - 0.5} H ${l + 0.5} Z`
  );
  const clip = useTransform([left, top, right, bottom], ([l = 0, t = 0, r = 0, b = 0]: number[]) => {
    if (!l && !t && !r && !b) return 'none';
    const inner = padding.current;
    return `inset(${t - inner.top}px ${-r - inner.right}px ${-b - inner.bottom}px ${l - inner.left}px)`;
  });

  return (
    <div ref={frame} className={cn('relative px-6 py-4 sm:px-9 sm:py-5', className)}>
      <motion.div aria-hidden style={{ clipPath: hatch }} className="hatch absolute -inset-10 opacity-60" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <motion.path d={outline} fill="none" strokeWidth={1} className="stroke-primary/70" />
      </svg>
      {CORNERS.map((corner) => (
        <Handle
          key={corner.corner}
          frame={name}
          corner={corner}
          edges={edges}
          grabbedRef={grabbed}
          className={corner.className}
        />
      ))}
      <motion.div style={{ clipPath: clip }} className="relative">
        {children}
      </motion.div>
    </div>
  );
}
