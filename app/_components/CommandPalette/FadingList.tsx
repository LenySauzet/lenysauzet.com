'use client';

import { useCallback, useRef } from 'react';

import { CommandList } from '@/components/ui/command';

const FADE = 80;
const fadeMask = (top: number, bottom: number) => {
  const head = FADE * top;
  const foot = FADE * bottom;

  return [
    'linear-gradient(to bottom',
    'transparent 0',
    `oklch(0 0 0 / 0.35) ${head * 0.4}px`,
    `black ${head}px`,
    `black calc(100% - ${foot}px)`,
    `oklch(0 0 0 / 0.35) calc(100% - ${foot * 0.4}px)`,
    'transparent 100%)',
  ].join(', ');
};

const ramp = (edge: 'top' | 'bottom') =>
  `linear-gradient(to ${edge === 'top' ? 'bottom' : 'top'}, black 0%, transparent 100%)`;
export function FadingList({ children }: { children: React.ReactNode }) {
  const list = useRef<HTMLElement | null>(null);
  const blurs = useRef<(HTMLDivElement | null)[]>([]);

  const draw = useCallback(() => {
    const node = list.current;
    if (!node) return;

    const below = node.scrollHeight - node.clientHeight - node.scrollTop;
    const top = Math.min(1, node.scrollTop / FADE);
    const bottom = Math.min(1, Math.max(0, below) / FADE);

    node.style.maskImage = fadeMask(top, bottom);
    node.style.webkitMaskImage = fadeMask(top, bottom);
    blurs.current.forEach((blur, index) => {
      if (blur) blur.style.opacity = String(index === 0 ? top : bottom);
    });
  }, []);
  const watchFrame = useCallback(
    (frame: HTMLDivElement | null) => {
      list.current = frame?.querySelector<HTMLElement>('[cmdk-list]') ?? null;
      const node = list.current;
      if (!node) return;

      const resized = new ResizeObserver(draw);
      resized.observe(node);

      const refilled = new MutationObserver(draw);
      refilled.observe(node, { childList: true, subtree: true });

      return () => {
        resized.disconnect();
        refilled.disconnect();
        list.current = null;
      };
    },
    [draw]
  );

  return (
    <div ref={watchFrame} className="relative">
      <CommandList onScroll={draw}>{children}</CommandList>
      {(['top', 'bottom'] as const).map((edge, index) => (
        <div
          key={edge}
          ref={(node) => {
            blurs.current[index] = node;
          }}
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 h-20 opacity-0 ${edge === 'top' ? 'top-0' : 'bottom-0'}`}
          style={{
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            maskImage: ramp(edge),
            WebkitMaskImage: ramp(edge),
          }}
        />
      ))}
    </div>
  );
}
