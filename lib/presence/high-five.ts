import type { Timed, Vector } from './motion';

export const SELF = '@';

const NEAR = 36;
const APART = 48;
const TOGETHER = 300;

export interface Hand {
  id: string;
  point: Vector;
}

interface Press extends Timed<Vector> {
  pairs: ReadonlySet<string>;
}

const pairOf = (a: string, b: string) => (a < b ? `${a} ${b}` : `${b} ${a}`);
const distance = (a: Vector, b: Vector) => Math.hypot(a.x - b.x, a.y - b.y);

export function nearPairs(hands: Hand[], previous: ReadonlySet<string>, isFree: (point: Vector) => boolean) {
  const freedom = new Map<string, boolean>();
  const free = ({ id, point }: Hand) => {
    if (!freedom.has(id)) freedom.set(id, isFree(point));
    return freedom.get(id);
  };
  const near = new Set<string>();
  for (let one = 0; one < hands.length; one += 1) {
    for (let other = one + 1; other < hands.length; other += 1) {
      const a = hands[one];
      const b = hands[other];
      if (!a || !b) continue;
      const pair = pairOf(a.id, b.id);
      if (distance(a.point, b.point) > (previous.has(pair) ? APART : NEAR)) continue;
      if (free(a) && free(b)) near.add(pair);
    }
  }
  return near;
}

export const handsIn = (pairs: ReadonlySet<string>) => new Set([...pairs].flatMap((pair) => pair.split(' ')));

export function createClapWatch() {
  const presses = new Map<string, Press>();

  return (id: string, press: Timed<Vector>, pairs: ReadonlySet<string>): Vector | undefined => {
    for (const [other, earlier] of presses) {
      if (Math.abs(press.at - earlier.at) > TOGETHER) {
        presses.delete(other);
        continue;
      }
      const pair = pairOf(id, other);
      if (!pairs.has(pair) && !earlier.pairs.has(pair)) continue;
      presses.delete(other);
      return { x: (press.value.x + earlier.value.x) / 2, y: (press.value.y + earlier.value.y) / 2 };
    }
    presses.set(id, { ...press, pairs });
    return undefined;
  };
}
