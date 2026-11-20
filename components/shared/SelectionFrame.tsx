'use client';

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';

import { EASE_OUT, rubberBand } from '@/lib/motion';
import { cn } from '@/lib/utils';

const STRETCH = 40;
const RETURN = { type: 'spring', stiffness: 380, damping: 20 } as const;
const RETURN_STILL = { duration: 0.2, ease: EASE_OUT } as const;

interface Corner {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

const useCorner = (): Corner => ({ x: useMotionValue(0), y: useMotionValue(0) });

function Handle({ corner, className }: { corner: Corner; className?: string }) {
  const still = useReducedMotion();
  const grabbedAt = useRef<{ x: number; y: number } | null>(null);

  const grab = (event: PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    corner.x.stop();
    corner.y.stop();
    grabbedAt.current = { x: event.clientX - corner.x.get(), y: event.clientY - corner.y.get() };
  };

  const pull = (event: PointerEvent<HTMLSpanElement>) => {
    const from = grabbedAt.current;
    if (!from) return;
    corner.x.set(rubberBand(event.clientX - from.x, STRETCH));
    corner.y.set(rubberBand(event.clientY - from.y, STRETCH));
  };

  const letGo = () => {
    if (!grabbedAt.current) return;
    grabbedAt.current = null;
    animate(corner.x, 0, still ? RETURN_STILL : RETURN);
    animate(corner.y, 0, still ? RETURN_STILL : RETURN);
  };

  return (
    <motion.span
      aria-hidden
      onPointerDown={grab}
      onPointerMove={pull}
      onPointerUp={letGo}
      onPointerCancel={letGo}
      style={{ x: corner.x, y: corner.y }}
      className={cn(
        'absolute z-10 grid size-6 cursor-grab touch-none place-items-center active:cursor-grabbing',
        className
      )}
    >
      <span className="size-2 border border-primary bg-background" />
    </motion.span>
  );
}

export function SelectionFrame({ children, className }: { children: ReactNode; className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const topLeft = useCorner();
  const topRight = useCorner();
  const bottomRight = useCorner();
  const bottomLeft = useCorner();

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measured = new ResizeObserver(([entry]) => {
      if (!entry) return;
      width.set(entry.borderBoxSize[0]?.inlineSize ?? element.offsetWidth);
      height.set(entry.borderBoxSize[0]?.blockSize ?? element.offsetHeight);
    });
    measured.observe(element);
    return () => measured.disconnect();
  }, [width, height]);

  const clipPath = useMotionTemplate`polygon(${topLeft.x}px ${topLeft.y}px, calc(100% + ${topRight.x}px) ${topRight.y}px, calc(100% + ${bottomRight.x}px) calc(100% + ${bottomRight.y}px), ${bottomLeft.x}px calc(100% + ${bottomLeft.y}px))`;
  const outline = useTransform(
    [width, height, topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y],
    ([w = 0, h = 0, ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0, dx = 0, dy = 0]: number[]) =>
      `M ${ax + 0.5} ${ay + 0.5} L ${w + bx - 0.5} ${by + 0.5} L ${w + cx - 0.5} ${h + cy - 0.5} L ${dx + 0.5} ${h + dy - 0.5} Z`
  );

  return (
    <div ref={frame} className={cn('relative px-6 py-4 sm:px-9 sm:py-5', className)}>
      <motion.div aria-hidden style={{ clipPath }} className="hatch absolute inset-0 opacity-60" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <motion.path d={outline} fill="none" strokeWidth={1} className="stroke-primary/70" />
      </svg>
      <Handle corner={topLeft} className="top-0 left-0 -translate-1/2" />
      <Handle corner={topRight} className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Handle corner={bottomRight} className="right-0 bottom-0 translate-1/2" />
      <Handle corner={bottomLeft} className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <div className="relative">{children}</div>
    </div>
  );
}
