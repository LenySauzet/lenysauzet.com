import { locate, spanOf } from '@/lib/presence/anchors';
import type { Connection } from '@/lib/presence/connection';
import type { Vector } from '@/lib/presence/motion';
import type { Span } from '@/lib/presence/protocol';

const SEND_EVERY = 40;
const SCROLL_SETTLES_AFTER = 160;
const SELECTION_SETTLES_AFTER = 120;

const sameSpan = (a?: Span, b?: Span) => a?.anchor === b?.anchor && a?.start === b?.start && a?.end === b?.end;

export function shareOwnCursor(connection: Connection) {
  const listening = new AbortController();
  const options = { passive: true, signal: listening.signal };
  let client: Vector | undefined;
  let sentAt = -Infinity;
  let pending = 0;
  let scrolling = 0;
  let selecting = 0;
  let shared: Span | undefined;

  const send = () => {
    pending = 0;
    if (!client || scrolling) return;
    connection.send({ type: 'move', point: locate(client) });
    sentAt = performance.now();
  };

  const schedule = () => {
    if (!client || pending || scrolling) return;
    const wait = SEND_EVERY - (performance.now() - sentAt);
    if (wait <= 0) send();
    else pending = window.setTimeout(send, wait);
  };

  const leave = () => {
    client = undefined;
    window.clearTimeout(pending);
    pending = 0;
    connection.send({ type: 'leave' });
  };

  const shareSelection = () => {
    selecting = 0;
    const selection = document.getSelection();
    const span = selection && !selection.isCollapsed && selection.rangeCount ? spanOf(selection.getRangeAt(0)) : undefined;
    if (sameSpan(span, shared)) return;
    shared = span;
    connection.send(span ? { type: 'highlight', span } : { type: 'unhighlight' });
  };

  connection.onOpen(() => {
    shared = undefined;
    shareSelection();
    send();
  });

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      client = { x: event.clientX, y: event.clientY };
      connection.wake();
      schedule();
    },
    options
  );
  window.addEventListener(
    'pointerdown',
    (event) => event.pointerType === 'mouse' && connection.send({ type: 'press' }),
    options
  );
  window.addEventListener(
    'pointerup',
    (event) => event.pointerType === 'mouse' && connection.send({ type: 'release' }),
    options
  );
  window.addEventListener(
    'scroll',
    () => {
      if (!client) return;
      if (!scrolling) {
        window.clearTimeout(pending);
        pending = 0;
        connection.send({ type: 'leave' });
      }
      window.clearTimeout(scrolling);
      scrolling = window.setTimeout(() => {
        scrolling = 0;
        send();
      }, SCROLL_SETTLES_AFTER);
    },
    options
  );
  document.addEventListener(
    'selectionchange',
    () => {
      window.clearTimeout(selecting);
      selecting = window.setTimeout(shareSelection, SELECTION_SETTLES_AFTER);
    },
    options
  );
  document.documentElement.addEventListener('mouseleave', leave, options);
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState !== 'hidden') return;
      leave();
      connection.sleep();
    },
    options
  );

  return () => {
    listening.abort();
    window.clearTimeout(pending);
    window.clearTimeout(scrolling);
    window.clearTimeout(selecting);
  };
}
