import { locate, spanOf } from '@/lib/presence/anchors';
import type { Connection } from '@/lib/presence/connection';
import { frames } from '@/lib/presence/frames';
import type { Timed, Vector } from '@/lib/presence/motion';
import { MOST_SAMPLES, type Pull, type Span, type Target } from '@/lib/presence/protocol';

const SEND_EVERY = 33;
const OLDEST = 1000;
const SCROLL_SETTLES_AFTER = 160;
const SELECTION_SETTLES_AFTER = 120;
const LONGEST_CLICK = 350;
const CLICK_SLOP = 8;

const sameSpan = (a?: Span, b?: Span) => a?.anchor === b?.anchor && a?.start === b?.start && a?.end === b?.end;

export function shareOwnCursor(connection: Connection, onClick: (point: Vector) => void) {
  const listening = new AbortController();
  const options = { passive: true, signal: listening.signal };
  let client: Vector | undefined;
  let aimed: Target | undefined;
  let pressed: Timed<Vector> | undefined;
  let covered = false;
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
    const located = scrolling || covered ? undefined : locate(taken.map(({ value }) => value), aimed);
    if (located) {
      aimed = located.target;
      const samples = located.placements.map((placement, index) => ({
        age: Math.min(OLDEST, Math.max(0, Math.round(now - (taken[index]?.at ?? now)))),
        ...placement,
      }));
      connection.send({ type: 'move', path: { ...located.target, samples } });
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
    aimed = undefined;
    pressed = undefined;
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
      if (scrolling || covered) return;
      take(event.timeStamp);
      connection.wake();
      schedule();
    },
    options
  );
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'mouse' || covered) return;
      pressed = event.button === 0 ? { at: event.timeStamp, value: { x: event.clientX, y: event.clientY } } : undefined;
      flush();
      connection.send({ type: 'press' });
    },
    options
  );
  window.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerType !== 'mouse' || covered) return;
      flush();
      connection.send({ type: 'release' });
      const click = pressed;
      pressed = undefined;
      if (
        click &&
        event.timeStamp - click.at < LONGEST_CLICK &&
        Math.hypot(event.clientX - click.value.x, event.clientY - click.value.y) < CLICK_SLOP &&
        document.getSelection()?.isCollapsed !== false
      )
        onClick({ x: click.value.x + window.scrollX, y: click.value.y + window.scrollY });
    },
    options
  );
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

  return {
    cover(next: boolean) {
      if (next === covered) return;
      covered = next;
      if (covered && client) leave();
    },
    stop() {
      listening.abort();
      stopSharingFrames();
      window.clearTimeout(pending);
      window.clearTimeout(scrolling);
      window.clearTimeout(selecting);
    },
  };
}
