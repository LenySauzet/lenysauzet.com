import { locate, spansOf } from '@/lib/presence/anchors';
import { createClickJudge } from '@/lib/presence/clicks';
import type { Connection } from '@/lib/presence/connection';
import { frames } from '@/lib/presence/frames';
import { layoutNow, LAYOUT_QUERIES } from '@/lib/presence/layout';
import type { Timed, Vector } from '@/lib/presence/motion';
import { encodeClient, MOST_SAMPLES, type ClientMessage, type Marks, type Pull } from '@/lib/presence/protocol';

const SEND_EVERY = 33;
const OLDEST = 1000;
const SCROLL_SETTLES_AFTER = 160;
const SELECTION_EVERY = 50;
const UNSHARED = '[data-presence-ignore]';

const isBackward = ({ anchorNode, anchorOffset, focusNode, focusOffset }: Selection) => {
  if (!anchorNode || !focusNode) return false;
  const range = document.createRange();
  range.setStart(anchorNode, anchorOffset);
  range.setEnd(focusNode, focusOffset);
  return range.collapsed && !(anchorNode === focusNode && anchorOffset === focusOffset);
};

function selectionMessage(): ClientMessage {
  const selection = document.getSelection();
  const spans = selection && !selection.isCollapsed && selection.rangeCount ? spansOf(selection.getRangeAt(0)) : [];
  if (!selection || !spans.length) return { type: 'unhighlight' };
  const marks: Marks = isBackward(selection)
    ? { layout: layoutNow(), spans, backward: true }
    : { layout: layoutNow(), spans };
  return { type: 'highlight', marks };
}

type Line = Pick<Connection, 'send' | 'wake' | 'sleep'>;

export function shareOwnCursor(connection: Line, onClick: (point: Vector) => void) {
  const listening = new AbortController();
  const options = { passive: true, signal: listening.signal };
  const judge = createClickJudge();
  let client: Vector | undefined;
  let held: string | undefined;
  let pressed: Timed<Vector> | undefined;
  let sentPress = false;
  let covered = false;
  let taken: Timed<Vector>[] = [];
  let pulled: Pull | undefined;
  let sentAt = -Infinity;
  let pending = 0;
  let scrolling = 0;
  let selecting = 0;
  let selectedAt = -Infinity;
  let shared = '';

  const cancelPending = () => {
    window.clearTimeout(pending);
    pending = 0;
  };

  const take = (at: number) => {
    if (!client) return;
    taken = [...taken, { at, value: { x: client.x + window.scrollX, y: client.y + window.scrollY } }].slice(
      -MOST_SAMPLES
    );
  };

  const flush = () => {
    cancelPending();
    const now = performance.now();
    const located =
      scrolling || covered
        ? undefined
        : locate(
            taken.map(({ value }) => value),
            held
          );
    if (located) {
      held = located.anchor;
      const { anchor, detail } = located;
      const samples = located.placements.map((placement, index) => ({
        age: Math.min(OLDEST, Math.max(0, Math.round(now - (taken[index]?.at ?? now)))),
        ...placement,
      }));
      const layout = layoutNow();
      connection.send({
        type: 'move',
        path: detail ? { anchor, layout, detail, samples } : { anchor, layout, samples },
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

  const hush = () => {
    taken = [];
    cancelPending();
    connection.send({ type: 'leave' });
  };

  const leave = () => {
    client = undefined;
    held = undefined;
    hush();
  };

  const shareSelection = () => {
    selecting = 0;
    selectedAt = performance.now();
    const message = selectionMessage();
    const encoded = encodeClient(message);
    if (encoded === shared) return;
    shared = encoded;
    connection.send(message);
  };

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
        event.button === 0 && !unshared && !covered
          ? { at: event.timeStamp, value: { x: event.clientX, y: event.clientY } }
          : undefined;
      sentPress = !covered && !unshared;
      if (!sentPress) return;
      flush();
      connection.send({ type: 'press' });
    },
    options
  );
  window.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      if (sentPress && !covered) {
        flush();
        connection.send({ type: 'release' });
      }
      const press = pressed;
      const announced = sentPress;
      pressed = undefined;
      sentPress = false;
      if (
        !press ||
        covered ||
        !judge(press, { x: event.clientX, y: event.clientY }, document.getSelection()?.isCollapsed !== false)
      )
        return;
      onClick(press.value);
      if (announced && !covered) connection.send({ type: 'click' });
    },
    options
  );
  window.addEventListener(
    'scroll',
    () => {
      if (!client) return;
      if (!scrolling) hush();
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
  for (const query of LAYOUT_QUERIES) window.matchMedia(query).addEventListener('change', shareSelection, options);
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
    opened() {
      shared = '';
      shareSelection();
      take(performance.now());
      flush();
    },
    cover(next: boolean) {
      if (next === covered) return;
      covered = next;
      if (covered && client) leave();
    },
    stop() {
      listening.abort();
      stopSharingFrames();
      cancelPending();
      window.clearTimeout(scrolling);
      window.clearTimeout(selecting);
    },
  };
}
