import { locate, spanOf } from '@/lib/presence/anchors';
import { createClickFilter } from '@/lib/presence/clicks';
import { layoutNow } from '@/lib/presence/layout';
import type { Connection } from '@/lib/presence/connection';
import { frames } from '@/lib/presence/frames';
import type { Timed, Vector } from '@/lib/presence/motion';
import { MOST_SAMPLES, type Pull, type Span } from '@/lib/presence/protocol';

const SEND_EVERY = 33;
const OLDEST = 1000;
const SCROLL_SETTLES_AFTER = 160;
const SELECTION_EVERY = 50;
const LONGEST_CLICK = 350;
const CLICK_SLOP = 8;
const UNSHARED = '[data-presence-ignore]';

const sameSpan = (a?: Span, b?: Span) =>
  a?.anchor === b?.anchor && a?.start === b?.start && a?.end === b?.end && a?.backward === b?.backward;

const isBackward = (selection: Selection) => {
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (!anchorNode || !focusNode) return false;
  const range = document.createRange();
  range.setStart(anchorNode, anchorOffset);
  range.setEnd(focusNode, focusOffset);
  return range.collapsed && !(anchorNode === focusNode && anchorOffset === focusOffset);
};

export function shareOwnCursor(connection: Connection, onClick: (point: Vector) => void) {
  const listening = new AbortController();
  const options = { passive: true, signal: listening.signal };
  let client: Vector | undefined;
  let held: string | undefined;
  let pressed: Timed<Vector> | undefined;
  let covered = false;
  let down = false;
  let taken: Timed<Vector>[] = [];
  let pulled: Pull | undefined;
  let sentAt = -Infinity;
  let pending = 0;
  let scrolling = 0;
  let selecting = 0;
  let shared: Span | undefined;
  let selectedAt = -Infinity;
  const isFresh = createClickFilter();

  const take = (at: number) => {
    if (!client) return;
    const point = { x: client.x + window.scrollX, y: client.y + window.scrollY };
    taken = [...taken, { at, value: point }].slice(-MOST_SAMPLES);
  };

  const flush = () => {
    window.clearTimeout(pending);
    pending = 0;
    const now = performance.now();
    const located = scrolling || covered ? undefined : locate(taken.map(({ value }) => value), held);
    if (located) {
      held = located.anchor;
      const samples = located.placements.map((placement, index) => ({
        age: Math.min(OLDEST, Math.max(0, Math.round(now - (taken[index]?.at ?? now)))),
        ...placement,
      }));
      connection.send({
        type: 'move',
        path: located.detail
          ? { anchor: located.anchor, layout: layoutNow(), detail: located.detail, samples }
          : { anchor: located.anchor, layout: layoutNow(), samples },
      });
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
    held = undefined;
    taken = [];
    window.clearTimeout(pending);
    pending = 0;
    connection.send({ type: 'leave' });
  };

  const shareSelection = () => {
    selecting = 0;
    selectedAt = performance.now();
    const selection = document.getSelection();
    const found = selection && !selection.isCollapsed && selection.rangeCount ? spanOf(selection.getRangeAt(0)) : undefined;
    const span = found && selection && isBackward(selection) ? { ...found, backward: true as const } : found;
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
      if (event.pointerType !== 'mouse') return;
      const unshared = event.target instanceof Element && event.target.closest(UNSHARED) !== null;
      pressed =
        event.button === 0 && !unshared ? { at: event.timeStamp, value: { x: event.clientX, y: event.clientY } } : undefined;
      if (covered || unshared) return;
      down = true;
      flush();
      connection.send({ type: 'press' });
    },
    options
  );
  window.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      if (down && !covered) {
        flush();
        connection.send({ type: 'release' });
      }
      down = false;
      const click = pressed;
      pressed = undefined;
      if (
        click &&
        event.timeStamp - click.at < LONGEST_CLICK &&
        Math.hypot(event.clientX - click.value.x, event.clientY - click.value.y) < CLICK_SLOP &&
        document.getSelection()?.isCollapsed !== false &&
        isFresh({ at: event.timeStamp, value: click.value })
      ) {
        onClick(click.value);
        if (!covered) connection.send({ type: 'click' });
      }
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
      if (selecting) return;
      selecting = window.setTimeout(shareSelection, Math.max(0, SELECTION_EVERY - (performance.now() - selectedAt)));
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
