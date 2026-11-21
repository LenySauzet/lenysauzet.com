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
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

import { EASE_OUT, rubberBand } from '@/lib/motion';
import { frames, type Corner } from '@/lib/presence/frames';
import { cn } from '@/lib/utils';

const STRETCH = 40;
const RETURN = { type: 'spring', stiffness: 380, damping: 20 } as const;
const FOLLOW = { type: 'spring', stiffness: 900, damping: 60 } as const;
const EASED = { duration: 0.2, ease: EASE_OUT } as const;

type Side = 'left' | 'top' | 'right' | 'bottom';
type Edges = Record<Side, MotionValue<number>>;

interface CornerHandle {
  index: Corner;
  x: Side;
  y: Side;
  className: string;
}

const CORNERS: CornerHandle[] = [
  { index: 0, x: 'left', y: 'top', className: 'top-0 left-0 -translate-1/2' },
  { index: 1, x: 'right', y: 'top', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
  { index: 2, x: 'right', y: 'bottom', className: 'right-0 bottom-0 translate-1/2' },
  { index: 3, x: 'left', y: 'bottom', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
];

const SIDES: Side[] = ['left', 'top', 'right', 'bottom'];

interface Held {
  corner: CornerHandle;
  x: number;
  y: number;
}

function settle(edges: Edges, held: Held | null, reducedMotion: boolean | null) {
  for (const side of SIDES) {
    const goal = held?.corner.x === side ? held.x : held?.corner.y === side ? held.y : 0;
    animate(edges[side], goal, reducedMotion ? EASED : RETURN);
  }
}

interface HandleProps {
  corner: CornerHandle;
  edges: Edges;
  onGrab: () => void;
  onPull: (corner: CornerHandle, x: number, y: number) => void;
  onLetGo: () => void;
}

function Handle({ corner, edges, onGrab, onPull, onLetGo }: HandleProps) {
  const grabbedAt = useRef<{ x: number; y: number } | null>(null);
  const x = edges[corner.x];
  const y = edges[corner.y];

  const grab = (event: PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    grabbedAt.current = { x: event.clientX - x.get(), y: event.clientY - y.get() };
    onGrab();
  };

  const pull = (event: PointerEvent<HTMLSpanElement>) => {
    const from = grabbedAt.current;
    if (from) onPull(corner, rubberBand(event.clientX - from.x, STRETCH), rubberBand(event.clientY - from.y, STRETCH));
  };

  const letGo = () => {
    if (!grabbedAt.current) return;
    grabbedAt.current = null;
    onLetGo();
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
        corner.className
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
  const reducedMotion = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const padding = useRef({ left: 0, top: 0, right: 0, bottom: 0 });
  const grabbed = useRef(false);
  const heldElsewhere = useRef<Held | null>(null);
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

  useEffect(
    () =>
      frames.onReceived(name, (event) => {
        if (event.type === 'drop') {
          heldElsewhere.current = null;
          if (!grabbed.current) settle(edges, null, reducedMotion);
          return;
        }
        const corner = CORNERS[event.pull.corner];
        if (!corner) return;
        heldElsewhere.current = { corner, x: event.pull.x, y: event.pull.y };
        if (grabbed.current) return;
        animate(edges[corner.x], event.pull.x, reducedMotion ? EASED : FOLLOW);
        animate(edges[corner.y], event.pull.y, reducedMotion ? EASED : FOLLOW);
      }),
    [edges, name, reducedMotion]
  );

  const grab = () => {
    for (const side of SIDES) edges[side].stop();
    grabbed.current = true;
  };

  const pull = (corner: CornerHandle, x: number, y: number) => {
    edges[corner.x].set(x);
    edges[corner.y].set(y);
    frames.share({ type: 'pull', pull: { frame: name, corner: corner.index, x, y } });
  };

  const letGo = () => {
    grabbed.current = false;
    settle(edges, heldElsewhere.current, reducedMotion);
    frames.share({ type: 'drop', frame: name });
  };

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
      <motion.div aria-hidden style={{ clipPath: hatch }} className="absolute -inset-10 bg-background" />
      <motion.div aria-hidden style={{ clipPath: hatch }} className="hatch absolute -inset-10 opacity-60" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <motion.path d={outline} fill="none" strokeWidth={1} className="stroke-primary/70" />
      </svg>
      {CORNERS.map((corner) => (
        <Handle key={corner.index} corner={corner} edges={edges} onGrab={grab} onPull={pull} onLetGo={letGo} />
      ))}
      <motion.div style={{ clipPath: clip }} className="relative">
        {children}
      </motion.div>
    </div>
  );
}
