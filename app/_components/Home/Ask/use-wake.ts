'use client';

import { animate, useMotionValue, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { across, near as isNear, stays, type Point } from '@/lib/ask/zones';
import { EASE_SNAP } from '@/lib/motion';

import { writingDuration } from './Letters';
import { AIM } from './motion';

export type Phase = 'tiny' | 'wide' | 'lit';

const FIRST_EXPAND_MS = 180;
const LIGHT_AFTER_MS = 260;
const FOLD_AFTER_MS = 80;
const SHRINK_AFTER_MS = 90;
const WRITE_DELAY = 0.05;
const TOP_ZONE = 64;
const BOTTOM_ZONE = 120;
const SHINE_REST = 30;
const SHINE_FOCUSED = 24;

const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function useScrollEnds() {
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const update = () => {
      const left = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      setAtEnd(window.scrollY < TOP_ZONE || left < BOTTOM_ZONE);
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

  return atEnd;
}

function usePointerNear(bar: RefObject<HTMLElement | null>, held: boolean) {
  const [near, setNear] = useState(false);
  const last = useRef<Point | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const element = bar.current;
      if (event.pointerType !== 'mouse' || !element) return;
      last.current = { x: event.clientX, y: event.clientY };
      setNear((already) => isNear(last.current!, element.getBoundingClientRect(), already));
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
    }, 360);
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
  const [coarse, setCoarse] = useState(false);
  const atEnd = useScrollEnds();
  const near = usePointerNear(bar, held);
  const [phase, setPhase] = useState<Phase>('tiny');
  const [written, setWritten] = useState(false);
  const shineX = useMotionValue(100);
  const glow = useMotionValue(0);
  const first = useRef(true);
  const waking = useRef<number[]>([]);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCoarse(!fine());
    const initial = requestAnimationFrame(update);
    query.addEventListener('change', update);
    return () => {
      cancelAnimationFrame(initial);
      query.removeEventListener('change', update);
    };
  }, []);

  const awake = still || coarse || atEnd || near || held;

  useEffect(() => {
    const local: number[] = [];
    const later = (into: number[], ms: number, run: () => void) => into.push(window.setTimeout(run, ms));

    if (!awake) {
      later(local, FOLD_AFTER_MS, () => {
        setPhase((current) => (current === 'lit' ? 'wide' : current));
        animate(glow, 0, { duration: 0.2 });
      });
      later(local, FOLD_AFTER_MS + SHRINK_AFTER_MS, () => {
        setPhase('tiny');
        setWritten(false);
      });
      return () => local.forEach(window.clearTimeout);
    }

    const start = first.current && !still ? FIRST_EXPAND_MS : 0;
    first.current = false;
    later(waking.current, start, () => setPhase((current) => (current === 'tiny' ? 'wide' : current)));
    later(waking.current, start + (still ? 0 : LIGHT_AFTER_MS), () => {
      setPhase('lit');
      if (still) {
        shineX.set(SHINE_REST);
        glow.set(0.7);
        setWritten(true);
        return;
      }
      const sweep = writingDuration(placeholder);
      shineX.set(100);
      glow.set(0);
      animate(glow, [0, 1, 0.7], { duration: sweep, delay: WRITE_DELAY, times: [0, 0.2, 1] });
      animate(shineX, SHINE_REST, { duration: sweep, delay: WRITE_DELAY, ease: [0.4, 0, 0.2, 1] });
      later(waking.current, (WRITE_DELAY + sweep) * 1000, () => setWritten(true));
    });
    return () => {
      waking.current.forEach(window.clearTimeout);
      waking.current = [];
    };
  }, [awake, still, placeholder, glow, shineX]);

  useEffect(() => {
    if (!written) return;
    const rest = () => {
      animate(glow, focused ? 1 : 0.7, { duration: 0.6 });
      animate(shineX, focused ? SHINE_FOCUSED : SHINE_REST, { duration: 0.8, ease: EASE_SNAP });
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
  }, [written, focused, still, coarse, bar, glow, shineX]);

  return { phase, written, shineX, glow, coarse, writeDelay: WRITE_DELAY };
}
