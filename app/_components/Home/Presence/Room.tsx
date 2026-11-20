'use client';

import { AnimatePresence, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { connect } from '@/lib/presence/connection';
import type { ServerMessage } from '@/lib/presence/protocol';
import { cn } from '@/lib/utils';

import { Cursor } from './Cursor';
import { shareOwnCursor } from './own-cursor';
import { createRemoteCursors } from './remote-cursors';
import { createRemoteHighlights } from './remote-highlights';

type Attach = (id: string, element: HTMLDivElement | null) => void;

export function Room({ url, className }: { url: string; className?: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const layer = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const stillness = useRef(still);
  const attachTo = useRef<Attach>(() => {});
  const attach = useCallback<Attach>((id, element) => attachTo.current(id, element), []);

  useEffect(() => {
    stillness.current = still;
  }, [still]);

  useEffect(() => {
    const top = layer.current;
    top?.showPopover();

    const cursors = createRemoteCursors(setIds, () => Boolean(stillness.current));
    const highlights = createRemoteHighlights();
    const redraw = () => highlights.redraw();

    const receive = (message: ServerMessage) => {
      switch (message.type) {
        case 'snapshot': {
          cursors.keepOnly(new Set(message.cursors.map(({ id }) => id)));
          highlights.keepOnly(new Set(message.highlights.map(({ id }) => id)));
          for (const { id, point } of message.cursors) cursors.move(id, point);
          for (const { id, span } of message.highlights) highlights.show(id, span);
          return;
        }
        case 'move':
          return cursors.move(message.id, message.point);
        case 'press':
          return cursors.press(message.id);
        case 'release':
          return cursors.release(message.id);
        case 'leave':
          return cursors.remove(message.id);
        case 'gone':
          cursors.remove(message.id);
          return highlights.hide(message.id);
        case 'highlight':
          return highlights.show(message.id, message.span);
        case 'unhighlight':
          return highlights.hide(message.id);
      }
    };

    const connection = connect(url, receive);
    const stopSharing = shareOwnCursor(connection);
    attachTo.current = cursors.attach;
    window.addEventListener('resize', redraw, { passive: true });

    return () => {
      window.removeEventListener('resize', redraw);
      stopSharing();
      connection.close();
      cursors.stop();
      highlights.stop();
      top?.hidePopover();
    };
  }, [url]);

  return (
    <div
      ref={layer}
      popover="manual"
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0',
        className
      )}
    >
      <AnimatePresence>
        {ids.map((id) => (
          <Cursor key={id} id={id} attach={attach} />
        ))}
      </AnimatePresence>
    </div>
  );
}
