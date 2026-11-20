'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { glassSurface } from '@/components/ui/glass';
import { useIslandStore } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { cn } from '@/lib/utils';

import { INSET, MORPH } from './motion';
import { Presentation } from './Presentation';
import { hint } from './states/hint';
import { identity } from './states/identity';
import { resting } from './states/resting';
import { useOpening } from './use-opening';

const COMPACT_HEIGHT = '2.75rem';
const MAX_WIDTH = '19rem';
const AT_THE_HEAD = '(min-width: 40rem)';
const MENTIONS_PALETTE_AFTER = 1400;
const MENTIONS_PALETTE_FOR = 2400;

const onBreakpoint = (change: () => void) => {
  const query = window.matchMedia(AT_THE_HEAD);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function Island({ className }: { className?: string }) {
  const [hovered, setHovered] = useState(false);
  const [widthWhenPointed, setWidthWhenPointed] = useState<number>();
  const pill = useRef<HTMLDivElement>(null);
  const mention = useRef(0);
  const presented = useIslandStore((state) => state.presented);
  const still = useReducedMotion();
  const atTheHead = useSyncExternalStore(
    onBreakpoint,
    () => window.matchMedia(AT_THE_HEAD).matches,
    () => true
  );

  useEffect(() => {
    mention.current = window.setTimeout(
      () => useIslandStore.getState().present(hint, { ttl: MENTIONS_PALETTE_FOR }),
      MENTIONS_PALETTE_AFTER
    );
    return () => window.clearTimeout(mention.current);
  }, []);

  const resolved = presented.at(-1) ?? (hovered ? hint : identity);
  const state = useOpening(resolved, resting);

  const point = () => {
    window.clearTimeout(mention.current);
    useIslandStore.getState().dismiss(hint.id);
    usePaletteStore.getState().want();
    setWidthWhenPointed(pill.current?.offsetWidth);
    setHovered(true);
  };

  return (
    <motion.div
      layout
      layoutRoot
      className={cn(
        'fixed bottom-6 left-[calc(50%-var(--removed-body-scroll-bar-size,0px)/2)] z-50 -translate-x-1/2 sm:top-6 sm:bottom-auto',
        className
      )}
    >
      <button
        type="button"
        aria-label="Open the command palette"
        onClick={() => usePaletteStore.getState().setIsOpen(true)}
        onPointerEnter={point}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => {
          if (usePaletteStore.getState().returningFocus) return;
          point();
        }}
        onBlur={() => setHovered(false)}
        className="group inline-flex cursor-pointer outline-none transition-[scale] duration-200 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        <motion.div
          ref={pill}
          layout
          layoutAnchor={{ x: 0.5, y: atTheHead ? 0 : 1 }}
          transition={still ? { duration: 0 } : MORPH}
          style={{
            borderRadius: 999,
            padding: INSET,
            minHeight: COMPACT_HEIGHT,
            width: state.width,
            minWidth: state.id === hint.id ? widthWhenPointed : undefined,
            maxWidth: MAX_WIDTH,
          }}
          className={cn(
            glassSurface,
            'glass-rim relative flex items-center overflow-hidden supports-[color:oklch(from_red_l_c_h)]:border-0 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background'
          )}
        >
          <div aria-hidden className="pointer-events-none flex w-full items-center text-left">
            <Presentation key={state.id}>{state.render()}</Presentation>
          </div>
        </motion.div>
      </button>
    </motion.div>
  );
}
