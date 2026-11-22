'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

import { useIslandStore } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { cn } from '@/lib/utils';

import { MENTIONS_PALETTE_AFTER, MENTIONS_PALETTE_FOR, MORPH } from './motion';
import { Presentation } from './Presentation';
import { viewOf, type Shown } from './views';

const AT_THE_HEAD = '(min-width: 40rem)';
const RESTS_FOR = 180;

const onBreakpoint = (change: () => void) => {
  const query = window.matchMedia(AT_THE_HEAD);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function Island({ className }: { className?: string }) {
  const t = useTranslations('Island');
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [widthWhenPointed, setWidthWhenPointed] = useState<number>();
  const [spoken, setSpoken] = useState<{ message: string; lang?: string }>();
  const offerName = useId();
  const pill = useRef<HTMLDivElement>(null);
  const mention = useRef(0);
  const presented = useIslandStore((state) => state.presented);
  const paletteOpen = usePaletteStore((state) => state.isOpen);
  const still = useReducedMotion();
  const atTheHead = useSyncExternalStore(
    onBreakpoint,
    () => window.matchMedia(AT_THE_HEAD).matches,
    () => true
  );
  const announcement = presented.findLast((presence) => presence.id === 'announcement');

  useEffect(() => {
    const opening = window.setTimeout(() => setOpened(true), RESTS_FOR);
    mention.current = window.setTimeout(
      () => useIslandStore.getState().present({ id: 'hint' }, { ttl: MENTIONS_PALETTE_FOR }),
      MENTIONS_PALETTE_AFTER
    );
    return () => {
      window.clearTimeout(opening);
      window.clearTimeout(mention.current);
    };
  }, []);

  useEffect(() => {
    if (paletteOpen) window.clearTimeout(mention.current);
  }, [paletteOpen]);

  useEffect(() => {
    if (!announcement) return;
    const speaking = window.setTimeout(() => setSpoken({ message: announcement.message, lang: announcement.lang }));
    return () => {
      window.clearTimeout(speaking);
      setSpoken(undefined);
    };
  }, [announcement]);

  const shown: Shown = opened ? (presented.at(-1) ?? { id: hovered ? 'hint' : 'identity' }) : { id: 'resting' };
  const view = viewOf(shown);
  const offer = shown.id === 'announcement' && shown.action ? { ...shown, action: shown.action } : undefined;

  const point = () => {
    window.clearTimeout(mention.current);
    useIslandStore.getState().dismiss('hint');
    usePaletteStore.getState().want();
    setWidthWhenPointed(pill.current?.offsetWidth);
    setHovered(true);
  };

  return (
    <motion.div
      layout
      layoutRoot
      data-presence-ignore
      className={cn(
        'fixed bottom-6 left-[calc(50%-var(--removed-body-scroll-bar-size,0px)/2)] z-50 -translate-x-1/2 sm:top-6 sm:bottom-auto',
        className
      )}
    >
      <button
        type="button"
        aria-label={offer ? undefined : t('open')}
        aria-labelledby={offer ? offerName : undefined}
        aria-haspopup={offer ? undefined : 'dialog'}
        aria-expanded={offer ? undefined : paletteOpen}
        onClick={() => {
          if (!offer) return usePaletteStore.getState().setIsOpen(true);
          useIslandStore.getState().dismiss('announcement');
          offer.action();
        }}
        onPointerEnter={point}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => {
          if (usePaletteStore.getState().returningFocus) return;
          point();
        }}
        onBlur={() => setHovered(false)}
        className="group inline-flex cursor-pointer outline-hidden transition-[scale] duration-200 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        {offer && (
          <span id={offerName} lang={offer.lang} className="sr-only">
            {offer.message}
          </span>
        )}
        <motion.div
          ref={pill}
          layout
          layoutAnchor={{ x: 0.5, y: atTheHead ? 0 : 1 }}
          transition={still ? { duration: 0 } : MORPH}
          style={{
            borderRadius: 999,
            width: view.width,
            minWidth: shown.id === 'hint' ? widthWhenPointed : undefined,
          }}
          className="glass-rim relative flex min-h-11 max-w-76 items-center overflow-hidden border border-border/60 bg-card/75 p-1.5 backdrop-blur-[6px] backdrop-saturate-[115%] supports-[color:oklch(from_red_l_c_h)]:border-0 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
        >
          <div aria-hidden className="pointer-events-none flex w-full items-center text-left">
            <Presentation key={view.key} className="flex w-full items-center">
              {view.content}
            </Presentation>
          </div>
        </motion.div>
      </button>
      <p role="status" lang={spoken?.lang} className="sr-only">
        {spoken?.message}
      </p>
    </motion.div>
  );
}
