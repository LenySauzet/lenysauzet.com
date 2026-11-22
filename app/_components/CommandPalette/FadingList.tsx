'use client';

import { useCallback, useRef, type CSSProperties, type ReactNode } from 'react';

import { CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const FADE_DISTANCE = 80;
const CLEAR_OF_EDGES = 12;
const ACROSS = `linear-gradient(to right, transparent, black ${CLEAR_OF_EDGES}px, black calc(100% - ${CLEAR_OF_EDGES}px), transparent)`;
const VEIL = 'pointer-events-none absolute inset-x-(--rim-width) opacity-0 backdrop-blur-xs';

const veil = (toward: 'top' | 'bottom'): CSSProperties => ({
  height: FADE_DISTANCE,
  maskImage: `linear-gradient(to ${toward}, transparent, black ${CLEAR_OF_EDGES}px, transparent), ${ACROSS}`,
  maskComposite: 'intersect',
});

function fadeMask(top: number, bottom: number) {
  const head = FADE_DISTANCE * top;
  const foot = FADE_DISTANCE * bottom;

  return [
    'linear-gradient(to bottom',
    'transparent 0',
    `rgb(0 0 0 / 0.35) ${head * 0.4}px`,
    `black ${head}px`,
    `black calc(100% - ${foot}px)`,
    `rgb(0 0 0 / 0.35) calc(100% - ${foot * 0.4}px)`,
    'transparent 100%)',
  ].join(', ');
}

export function FadingList({ children, className }: { children: ReactNode; className?: string }) {
  const list = useRef<HTMLElement | null>(null);
  const topVeil = useRef<HTMLDivElement>(null);
  const bottomVeil = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const node = list.current;
    if (!node) return;

    const below = node.scrollHeight - node.clientHeight - node.scrollTop;
    const top = Math.min(1, node.scrollTop / FADE_DISTANCE);
    const bottom = Math.min(1, Math.max(0, below) / FADE_DISTANCE);
    const mask = fadeMask(top, bottom);

    node.style.maskImage = mask;
    node.style.webkitMaskImage = mask;
    if (topVeil.current) topVeil.current.style.opacity = String(top);
    if (bottomVeil.current) bottomVeil.current.style.opacity = String(bottom);
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
    <div ref={watchFrame} className={cn('relative', className)}>
      <CommandList onScroll={draw}>{children}</CommandList>
      <div ref={topVeil} aria-hidden style={veil('bottom')} className={cn(VEIL, 'top-0')} />
      <div ref={bottomVeil} aria-hidden style={veil('top')} className={cn(VEIL, 'bottom-(--rim-width)')} />
    </div>
  );
}
