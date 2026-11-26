'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { breathe, LAYOUTS, rest, step, type Count } from './orb/layout';
import { orbRenderer } from './orb/renderer';

interface OrbProps {
  count?: Count;
  size?: number;
  spin?: boolean;
  className?: string;
}

export function Orb({ count = 1, size = 28, spin = false, className }: OrbProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef({ count, spin });
  const still = useReducedMotion();

  useEffect(() => {
    target.current = { count, spin };
  }, [count, spin]);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const pixels = Math.round(size * scale);
    element.width = pixels;
    element.height = pixels;
    const bodies = rest(LAYOUTS[target.current.count]);
    let visible = true;
    const watch = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    watch.observe(element);

    const renderer = orbRenderer();
    const entry = {
      context,
      width: pixels,
      height: pixels,
      frame: (time: number, dt: number) => {
        const goal = LAYOUTS[target.current.count];
        if (visible) step(bodies, goal, dt);
        return {
          pixel: 2.6 / pixels,
          spheres: bodies.map((body, index) =>
            still ? body.value : breathe(body.value, index, time, target.current.spin ? 0.55 : 0)
          ),
        };
      },
    };
    renderer.add(entry);
    return () => {
      renderer.remove(entry);
      watch.disconnect();
    };
  }, [size, still]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className={cn('shrink-0', className)}
      style={{ width: size, height: size }}
    />
  );
}
