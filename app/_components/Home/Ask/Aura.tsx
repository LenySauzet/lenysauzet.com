'use client';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';

import { paintGlow } from '@/lib/orb/glow';

import { RING } from './styles';

const RESOLUTION = 2;
const SPHERE_SHARE = 0.47;

interface LightProps {
  frame: RefObject<HTMLElement | null>;
  avatar: RefObject<HTMLElement | null>;
}

function useAvatarPoint({ frame, avatar }: LightProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const size = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    const follow = () => {
      const box = frame.current?.getBoundingClientRect();
      const orb = avatar.current?.querySelector('canvas')?.getBoundingClientRect();
      if (box && orb) {
        width.set(box.width);
        height.set(box.height);
        x.set(orb.left + orb.width / 2 - box.left);
        y.set(orb.top + orb.height / 2 - box.top);
        size.set(orb.width * SPHERE_SHARE);
      }
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [frame, avatar, x, y, size, width, height]);

  return { x, y, size, width, height };
}

export function Aura({ thinking, ...refs }: LightProps & { thinking: boolean }) {
  const { x, y, size, width, height } = useAvatarPoint(refs);
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useReducedMotion();

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    let drawn = '';
    let raf = 0;
    const draw = () => {
      const columns = Math.ceil(width.get() / RESOLUTION);
      const rows = Math.ceil(height.get() / RESOLUTION);
      const key = [columns, rows, x.get(), y.get(), size.get()].map(Math.round).join();
      if (columns > 0 && rows > 0 && size.get() > 0 && key !== drawn) {
        drawn = key;
        element.width = columns;
        element.height = rows;
        const image = context.createImageData(columns, rows);
        paintGlow(image, RESOLUTION, { x: x.get(), y: y.get(), size: size.get() });
        context.putImageData(image, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [x, y, size, width, height]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      initial={{ opacity: 0 }}
      animate={{ opacity: thinking ? 1 : 0 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: thinking ? 0.7 : 0.9, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 origin-[0%_85%]"
        animate={still ? undefined : { opacity: [0.82, 1, 0.82], scale: [1, 1.025, 1] }}
        transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
      >
        <canvas
          ref={canvas}
          className="absolute inset-0 size-full dark:[filter:none] [filter:invert(1)_hue-rotate(180deg)]"
        />
      </motion.div>
    </motion.div>
  );
}

const LAVENDER = (alpha: number) => `oklch(from var(--primary) calc(l + 0.24) 0.1 calc(h + 32) / ${alpha})`;
const MILK = (alpha: number) => `oklch(from var(--glare) l c h / ${alpha})`;

export function EdgeLight(refs: LightProps) {
  const { y } = useAvatarPoint(refs);
  const still = useReducedMotion();
  const background = useMotionTemplate`radial-gradient(ellipse 30px 260px at 0px ${y}px, ${LAVENDER(0.55)}, ${MILK(0.12)} 55%, transparent), oklch(from var(--foreground) l c h / 0)`;

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
      style={{ ...RING, background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: still ? 1 : [0.7, 1, 0.7] }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={still ? { duration: 0.4 } : { duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
    />
  );
}
