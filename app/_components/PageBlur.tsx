'use client';

import { useEffect, useRef } from 'react';

import { blurLayers } from '@/lib/blur';
import { cn } from '@/lib/utils';

const LAYERS = blurLayers(6, 12).map(({ radius, from, to }) => ({
  key: from,
  backdropFilter: `blur(${radius.toFixed(2)}px)`,
  maskImage: `linear-gradient(to bottom, transparent ${(from * 100).toFixed(1)}%, black ${(to * 100).toFixed(1)}%)`,
}));

export function PageBlur({ className }: { className?: string }) {
  const band = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = band.current;
    if (!element) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const left = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      const reach = Math.min(1, Math.max(0, left / element.offsetHeight));
      element.style.transform = reach < 1 ? `scaleY(${reach.toFixed(4)})` : '';
      element.style.visibility = reach > 0 ? '' : 'hidden';
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const listening = new AbortController();
    const options = { passive: true, signal: listening.signal };
    window.addEventListener('scroll', schedule, options);
    window.addEventListener('resize', schedule, options);
    const resized = new ResizeObserver(schedule);
    resized.observe(document.body);
    update();

    return () => {
      listening.abort();
      resized.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={band}
      aria-hidden
      className={cn('pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 origin-bottom print:hidden', className)}
    >
      {LAYERS.map(({ key, backdropFilter, maskImage }) => (
        <div
          key={key}
          className="absolute inset-0"
          style={{ backdropFilter, WebkitBackdropFilter: backdropFilter, maskImage, WebkitMaskImage: maskImage }}
        />
      ))}
    </div>
  );
}
