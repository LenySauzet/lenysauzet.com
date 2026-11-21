import { createClapWatch, handsIn, nearPairs, SELF, type Placed } from '@/lib/presence/high-five';
import type { Vector } from '@/lib/presence/motion';

const ACTIONS =
  'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable], [data-presence-ignore], [data-presence-action]';

interface HighFiveOptions {
  onHands: (ids: Set<string>) => void;
  onClap: (point: Vector) => void;
}

const isFree = ({ x, y }: Vector) => {
  const under = document.elementFromPoint(x - window.scrollX, y - window.scrollY);
  return under !== null && !under.closest(ACTIONS);
};

const sameIds = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((id) => b.has(id));

export function createHighFive({ onHands, onClap }: HighFiveOptions) {
  const listening = new AbortController();
  const options = { passive: true, signal: listening.signal };
  const clap = createClapWatch();
  let pointer: Vector | undefined;
  let others = new Map<string, Vector>();
  let pairs = new Set<string>();
  let hands = new Set<string>();
  let covered = false;

  const ownPoint = () => pointer && { x: pointer.x + window.scrollX, y: pointer.y + window.scrollY };

  const update = () => {
    const placed: Placed[] = [...others].map(([id, point]) => ({ id, point }));
    const own = ownPoint();
    if (own && !covered) placed.push({ id: SELF, point: own });
    pairs = nearPairs(placed, pairs, isFree);
    const next = handsIn(pairs);
    if (sameIds(next, hands)) return;
    hands = next;
    document.documentElement.style.cursor = hands.has(SELF) ? 'grab' : '';
    onHands(new Set([...hands].filter((id) => id !== SELF)));
  };

  const putAway = () => {
    pointer = undefined;
    update();
  };

  const press = (id: string, point: Vector, at: number) => {
    const met = clap(id, { at, value: point }, pairs);
    if (met) onClap(met);
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      pointer = event.buttons === 0 ? { x: event.clientX, y: event.clientY } : undefined;
      update();
    },
    options
  );
  window.addEventListener(
    'pointerdown',
    (event) => {
      const own = ownPoint();
      if (event.pointerType === 'mouse' && event.button === 0 && own) press(SELF, own, event.timeStamp);
    },
    options
  );
  window.addEventListener('scroll', update, options);
  document.documentElement.addEventListener('mouseleave', putAway, options);
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) putAway();
    },
    options
  );

  return {
    drawn(points: Map<string, Vector>) {
      others = points;
      update();
    },
    keepOnly(ids: Set<string>) {
      others = new Map([...others].filter(([id]) => ids.has(id)));
      update();
    },
    press,
    cover(next: boolean) {
      covered = next;
      update();
    },
    stop() {
      listening.abort();
      document.documentElement.style.cursor = '';
    },
  };
}
