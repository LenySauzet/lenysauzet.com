'use client';

import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '@/lib/motion';
import { connect } from '@/lib/presence/connection';
import { frames } from '@/lib/presence/frames';
import { layoutNow, LAYOUT_QUERIES } from '@/lib/presence/layout';
import type { Vector } from '@/lib/presence/motion';
import { watchOverlays } from '@/lib/presence/overlays';
import { cn } from '@/lib/utils';

import { Cursor } from './Cursor';
import { createHighFive } from './high-five';
import { shareOwnCursor } from './own-cursor';
import { createRemoteCursors, type Ink } from './remote-cursors';
import { createRemoteHighlights } from './remote-highlights';
import { createRipples } from './ripple';
import { createRoomState } from './room-state';

const SURFACE =
  'pointer-events-none fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0';

type Attach = (id: string, ink: Ink | null) => void;

export function Room({ url, className }: { url: string; className?: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const [covered, setCovered] = useState(false);
  const cursorLayer = useRef<HTMLDivElement>(null);
  const rippleLayer = useRef<HTMLDivElement>(null);
  const attachTo = useRef<Attach>(() => {});
  const attach = useCallback<Attach>((id, ink) => attachTo.current(id, ink), []);

  useEffect(() => {
    const cursorsAbove = cursorLayer.current;
    const ripplesAbove = rippleLayer.current;
    if (!cursorsAbove || !ripplesAbove) return;
    ripplesAbove.showPopover();
    cursorsAbove.showPopover();

    const ripples = createRipples(ripplesAbove);
    const toClient = ({ x, y }: Vector) => ({ x: x - window.scrollX, y: y - window.scrollY });
    const ripple = (client: Vector) => {
      if (!prefersReducedMotion()) ripples.at(client);
    };
    const highFive = createHighFive({
      onHands: (ids) => cursors.showHands(ids),
      onClap: (point) => {
        if (!prefersReducedMotion()) ripples.across(toClient(point));
      },
    });
    const cursors = createRemoteCursors({
      onChange: (ids) => {
        setIds(ids);
        highFive.keepOnly(new Set(ids));
      },
      onClick: (point) => ripple(toClient(point)),
      onPress: highFive.press,
      onFrame: (id, event) => room.framed(id, event),
      onDrawn: highFive.drawn,
      reducedMotion: prefersReducedMotion,
    });
    const highlights = createRemoteHighlights(prefersReducedMotion);
    const room = createRoomState({ cursors, highlights, frames, layoutNow });
    attachTo.current = cursors.attach;

    const connection = connect(url, {
      onMessage: room.receive,
      onOpen: () => sharing.opened(),
      onLost: room.reset,
    });
    const sharing = shareOwnCursor(connection, ripple);

    const stopWatching = watchOverlays((next) => {
      setCovered(next);
      sharing.cover(next);
      cursors.cover(next);
      highlights.cover(next);
      highFive.cover(next);
    });
    const queries = LAYOUT_QUERIES.map((query) => window.matchMedia(query));
    for (const query of queries) query.addEventListener('change', room.regroup);

    return () => {
      for (const query of queries) query.removeEventListener('change', room.regroup);
      stopWatching();
      sharing.stop();
      connection.close();
      room.dispose();
      highFive.stop();
      cursors.stop();
      highlights.stop();
      ripples.stop();
      cursorsAbove.hidePopover();
      ripplesAbove.hidePopover();
    };
  }, [url]);

  return (
    <>
      <div ref={rippleLayer} popover="manual" aria-hidden className={SURFACE} />
      <div
        ref={cursorLayer}
        popover="manual"
        aria-hidden
        className={cn(SURFACE, 'transition-opacity duration-200', covered && 'opacity-0', className)}
      >
        <AnimatePresence>
          {ids.map((id) => (
            <Cursor key={id} id={id} attach={attach} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
