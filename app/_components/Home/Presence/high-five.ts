import { createClapWatch, handsIn, nearPairs, SELF, type Hand } from '@/lib/presence/high-five';
import type { Vector } from '@/lib/presence/motion';

const FRESH = 500;
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

  const onPage = ({ x, y }: Vector) => ({ x: x + window.scrollX, y: y + window.scrollY });

  const update = () => {
    const present: Hand[] = [...others].map(([id, point]) => ({ id, point }));
    if (pointer && !covered) present.push({ id: SELF, point: onPage(pointer) });
    pairs = nearPairs(present, pairs, isFree);
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
    if (performance.now() - at > FRESH) return;
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
      if (event.pointerType !== 'mouse' || event.button !== 0 || covered) return;
      press(SELF, onPage({ x: event.clientX, y: event.clientY }), event.timeStamp);
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
