'use client';

import { AnimatePresence, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { connect } from '@/lib/presence/connection';
import { frames, type FrameEvent } from '@/lib/presence/frames';
import { watchOverlays } from '@/lib/presence/overlays';
import type { ServerMessage } from '@/lib/presence/protocol';
import { cn } from '@/lib/utils';

import { Cursor } from './Cursor';
import { shareOwnCursor } from './own-cursor';
import { createRemoteCursors } from './remote-cursors';
import { createRemoteHighlights } from './remote-highlights';
import { createRipples } from './ripple';

type Attach = (id: string, element: HTMLElement | null) => void;

export function Room({ url, className }: { url: string; className?: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const [covered, setCovered] = useState(false);
  const layer = useRef<HTMLDivElement>(null);
  const waves = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const stillness = useRef(still);
  const attachTo = useRef<Attach>(() => {});
  const attach = useCallback<Attach>((id, element) => attachTo.current(id, element), []);

  useEffect(() => {
    stillness.current = still;
  }, [still]);

  useEffect(() => {
    const top = layer.current;
    const above = waves.current;
    if (!top || !above) return;
    top.showPopover();
    above.showPopover();

    const isStill = () => Boolean(stillness.current);
    const ripples = createRipples(above);
    const cursors = createRemoteCursors({
      onChange: setIds,
      onClick: (_, point) => {
        if (!isStill()) ripples.at({ x: point.x - window.scrollX, y: point.y - window.scrollY });
      },
      isStill,
    });
    const highlights = createRemoteHighlights(isStill);
    const pulling = new Map<string, string>();
    const replays = new Map<string, { due: number; timers: Set<number> }>();

    const replay = (id: string, event: FrameEvent) => {
      const queue = replays.get(id) ?? { due: 0, timers: new Set<number>() };
      replays.set(id, queue);
      queue.due = Math.max(queue.due, performance.now() + cursors.delayOf(id));
      const timer = window.setTimeout(() => {
        queue.timers.delete(timer);
        frames.receive(event);
      }, queue.due - performance.now());
      queue.timers.add(timer);
    };

    const forget = (id: string) => {
      for (const timer of replays.get(id)?.timers ?? []) window.clearTimeout(timer);
      replays.delete(id);
    };

    const receive = (message: ServerMessage) => {
      switch (message.type) {
        case 'snapshot': {
          cursors.keepOnly(new Set(message.cursors.map(({ id }) => id)));
          highlights.keepOnly(new Set(message.highlights.map(({ id }) => id)));
          for (const { id, path } of message.cursors) cursors.move(id, path);
          for (const { id, span } of message.highlights) highlights.show(id, span);
          return;
        }
        case 'move':
          return cursors.move(message.id, message.path);
        case 'press':
          return cursors.press(message.id);
        case 'release':
          return cursors.release(message.id);
        case 'leave':
          return cursors.remove(message.id);
        case 'gone': {
          forget(message.id);
          const frame = pulling.get(message.id);
          if (frame) frames.receive({ type: 'drop', frame });
          pulling.delete(message.id);
          cursors.remove(message.id);
          return highlights.hide(message.id);
        }
        case 'highlight':
          return highlights.show(message.id, message.span);
        case 'unhighlight':
          return highlights.hide(message.id);
        case 'pull':
          pulling.set(message.id, message.pull.frame);
          return replay(message.id, { type: 'pull', pull: message.pull });
        case 'drop':
          pulling.delete(message.id);
          return replay(message.id, { type: 'drop', frame: message.frame });
      }
    };

    const connection = connect(url, receive);
    const sharing = shareOwnCursor(connection, (point) => {
      if (!isStill()) ripples.at(point);
    });
    const stopWatching = watchOverlays((next) => {
      setCovered(next);
      sharing.cover(next);
      highlights.cover(next);
    });
    attachTo.current = cursors.attach;

    return () => {
      for (const id of [...replays.keys()]) forget(id);
      stopWatching();
      sharing.stop();
      connection.close();
      cursors.stop();
      highlights.stop();
      ripples.stop();
      top.hidePopover();
      above.hidePopover();
    };
  }, [url]);

  const surface = 'pointer-events-none fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0';

  return (
    <>
      <div
        ref={layer}
        popover="manual"
        aria-hidden
        className={cn(surface, 'transition-opacity duration-200', covered && 'opacity-0', className)}
      >
        <AnimatePresence>
          {ids.map((id) => (
            <Cursor key={id} id={id} attach={attach} />
          ))}
        </AnimatePresence>
      </div>
      <div ref={waves} popover="manual" aria-hidden className={surface} />
    </>
  );
}
