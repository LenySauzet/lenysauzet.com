'use client';

import { animate, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { startAt, travel, type Travel } from '@/lib/ask/travel';
import { across, near as isNear, stays, type Point } from '@/lib/ask/zones';
import { EASE_SNAP } from '@/lib/motion';

import { writingDuration } from './Letters';
import { AIM, EASE_SWEEP } from './motion';

export type Phase = 'tiny' | 'wide' | 'lit';

const FIRST_EXPAND_MS = 180;
const LIGHT_AFTER_MS = 260;
const FOLD_AFTER_MS = 80;
const SHRINK_AFTER_MS = 90;
const RECHECK_MS = 360;
const WRITE_DELAY = 0.05;
const TOP_ZONE = 64;
const BOTTOM_ZONE = 120;
const SHINE_REST = 30;
const SHINE_FOCUSED = 24;
const GLOW_REST = 0.7;

const FINE_POINTER = '(hover: hover) and (pointer: fine)';

function useScroll() {
  const [scroll, setScroll] = useState({ atEnd: false, rising: false });

  useEffect(() => {
    let moved: Travel | null = null;
    const update = () => {
      const room = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY, 0), room);
      const next: Travel = moved ? travel(moved, y) : startAt(y);
      moved = next;
      const atEnd = y < TOP_ZONE || room - y < BOTTOM_ZONE;
      setScroll((current) =>
        current.atEnd === atEnd && current.rising === next.rising ? current : { atEnd, rising: next.rising }
      );
    };
    const first = requestAnimationFrame(update);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return scroll;
}

function useCoarse() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(FINE_POINTER);
    const update = () => setCoarse(!query.matches);
    const initial = requestAnimationFrame(update);
    query.addEventListener('change', update);
    return () => {
      cancelAnimationFrame(initial);
      query.removeEventListener('change', update);
    };
  }, []);

  return coarse;
}

function usePointerNear(bar: RefObject<HTMLElement | null>, held: boolean) {
  const [near, setNear] = useState(false);
  const last = useRef<Point | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const element = bar.current;
      if (event.pointerType !== 'mouse' || !element) return;
      const pointer = { x: event.clientX, y: event.clientY };
      last.current = pointer;
      setNear((already) => isNear(pointer, element.getBoundingClientRect(), already));
    };
    const onLeave = () => setNear(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [bar]);

  useEffect(() => {
    if (held) return;
    const recheck = window.setTimeout(() => {
      const element = bar.current;
      const pointer = last.current;
      setNear(Boolean(element && pointer && isNear(pointer, element.getBoundingClientRect(), false)));
    }, RECHECK_MS);
    return () => window.clearTimeout(recheck);
  }, [held, bar]);

  return near;
}

interface WakeOptions {
  held: boolean;
  focused: boolean;
  placeholder: string;
}

export function useWake(bar: RefObject<HTMLElement | null>, { held, focused, placeholder }: WakeOptions) {
  const still = Boolean(useReducedMotion());
  const coarse = useCoarse();
  const { atEnd, rising } = useScroll();
  const near = usePointerNear(bar, held);
  const [phase, setPhase] = useState<Phase>('tiny');
  const [written, setWritten] = useState(false);
  const shineX = useMotionValue(100);
  const glow = useMotionValue(0);
  const shown = useRef({ written: false, entered: false, first: true });

  const awake = still || atEnd || near || held || (coarse && rising);
  const lit = phase === 'lit';

  useEffect(() => {
    const timers: number[] = [];
    const running: AnimationPlaybackControls[] = [];
    const later = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
    const write = (value: boolean) => {
      shown.current.written = value;
      setWritten(value);
    };
    const cleanup = () => {
      timers.forEach(window.clearTimeout);
      running.forEach((animation) => animation.stop());
    };

    if (!awake) {
      later(FOLD_AFTER_MS, () => {
        setPhase((current) => (current === 'lit' ? 'wide' : current));
        running.push(animate(glow, 0, { duration: 0.2 }));
      });
      later(FOLD_AFTER_MS + SHRINK_AFTER_MS, () => {
        setPhase('tiny');
        write(false);
      });
      return cleanup;
    }

    if (shown.current.written) {
      setPhase('lit');
      return cleanup;
    }

    const quiet = still || (coarse && shown.current.entered);
    const start = shown.current.first && !still ? FIRST_EXPAND_MS : 0;
    later(start, () => {
      shown.current.first = false;
      setPhase((current) => (current === 'tiny' ? 'wide' : current));
    });
    later(start + (still ? 0 : LIGHT_AFTER_MS), () => {
      setPhase('lit');
      if (quiet) {
        shineX.set(SHINE_REST);
        write(true);
        return;
      }
      const sweep = writingDuration(placeholder);
      shown.current.entered = true;
      shineX.set(100);
      glow.set(0);
      running.push(
        animate(glow, [0, 1, GLOW_REST], { duration: sweep, delay: WRITE_DELAY, times: [0, 0.2, 1] }),
        animate(shineX, SHINE_REST, { duration: sweep, delay: WRITE_DELAY, ease: EASE_SWEEP })
      );
      later((WRITE_DELAY + sweep) * 1000, () => write(true));
    });
    return cleanup;
  }, [awake, still, coarse, placeholder, glow, shineX]);

  useEffect(() => {
    if (!written || !lit) return;
    const rest = () => {
      const level = focused ? 1 : GLOW_REST;
      const shine = focused ? SHINE_FOCUSED : SHINE_REST;
      if (still) {
        glow.set(level);
        shineX.set(shine);
        return;
      }
      animate(glow, level, { duration: 0.6 });
      animate(shineX, shine, { duration: 0.8, ease: EASE_SNAP });
    };
    rest();
    if (still || coarse) return;
    let aiming = false;
    const onMove = (event: PointerEvent) => {
      const element = bar.current;
      if (event.pointerType !== 'mouse' || !element) return;
      const bounds = element.getBoundingClientRect();
      const pointer = { x: event.clientX, y: event.clientY };
      if (!stays(pointer, bounds)) {
        if (aiming) rest();
        aiming = false;
        return;
      }
      aiming = true;
      const over = pointer.y >= bounds.top && pointer.x >= bounds.left && pointer.x <= bounds.right;
      animate(shineX, across(pointer, bounds), AIM);
      animate(glow, over ? 1 : 0.85, { duration: 0.4 });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [written, lit, focused, still, coarse, bar, glow, shineX]);

  return { phase, written, shineX, glow, writeDelay: WRITE_DELAY };
}
