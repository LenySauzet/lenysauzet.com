import { locate, spanOf } from '@/lib/presence/anchors';
import type { Connection } from '@/lib/presence/connection';
import { frames } from '@/lib/presence/frames';
import type { Timed, Vector } from '@/lib/presence/motion';
import { MOST_SAMPLES, type Pull, type Span } from '@/lib/presence/protocol';

const SEND_EVERY = 33;
const OLDEST = 1000;
const SCROLL_SETTLES_AFTER = 160;
const SELECTION_SETTLES_AFTER = 120;

const sameSpan = (a?: Span, b?: Span) => a?.anchor === b?.anchor && a?.start === b?.start && a?.end === b?.end;

export function shareOwnCursor(connection: Connection) {
  const listening = new AbortController();
  const options = { passive: true, signal: listening.signal };
  let client: Vector | undefined;
  let taken: Timed<Vector>[] = [];
  let pulled: Pull | undefined;
  let sentAt = -Infinity;
  let pending = 0;
  let scrolling = 0;
  let selecting = 0;
  let shared: Span | undefined;

  const take = (at: number) => {
    if (!client) return;
    const point = { x: client.x + window.scrollX, y: client.y + window.scrollY };
    taken = [...taken, { at, value: point }].slice(-MOST_SAMPLES);
  };

  const flush = () => {
    window.clearTimeout(pending);
    pending = 0;
    const now = performance.now();
    const located = scrolling ? undefined : locate(taken.map(({ value }) => value));
    if (located) {
      const samples = located.placements.map((placement, index) => ({
        age: Math.min(OLDEST, Math.max(0, Math.round(now - (taken[index]?.at ?? now)))),
        ...placement,
      }));
      connection.send({ type: 'move', path: { anchor: located.anchor, samples } });
    }
    if (pulled) connection.send({ type: 'pull', pull: pulled });
    taken = [];
    pulled = undefined;
    sentAt = now;
  };

  const schedule = () => {
    if (pending) return;
    const wait = SEND_EVERY - (performance.now() - sentAt);
    if (wait <= 0) flush();
    else pending = window.setTimeout(flush, wait);
  };

  const leave = () => {
    client = undefined;
    taken = [];
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
    take(performance.now());
    flush();
  });

  const stopSharingFrames = frames.onShared((event) => {
    if (event.type === 'pull') {
      pulled = event.pull;
      schedule();
      return;
    }
    flush();
    connection.send({ type: 'drop', frame: event.frame });
  });

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      client = { x: event.clientX, y: event.clientY };
      if (scrolling) return;
      take(event.timeStamp);
      connection.wake();
      schedule();
    },
    options
  );
  for (const [type, signal] of [
    ['pointerdown', 'press'],
    ['pointerup', 'release'],
  ] as const) {
    window.addEventListener(
      type,
      (event) => {
        if (event.pointerType !== 'mouse') return;
        flush();
        connection.send({ type: signal });
      },
      options
    );
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!client) return;
      if (!scrolling) {
        taken = [];
        window.clearTimeout(pending);
        pending = 0;
        connection.send({ type: 'leave' });
      }
      window.clearTimeout(scrolling);
      scrolling = window.setTimeout(() => {
        scrolling = 0;
        take(performance.now());
        flush();
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
    stopSharingFrames();
    window.clearTimeout(pending);
    window.clearTimeout(scrolling);
    window.clearTimeout(selecting);
  };
}
