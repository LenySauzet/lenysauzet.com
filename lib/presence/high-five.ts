import type { Timed, Vector } from './motion';

export const SELF = '@';

const NEAR = 36;
const APART = 48;
const TOGETHER = 300;

export interface Placed {
  id: string;
  point: Vector;
}

const pairOf = (a: string, b: string) => (a < b ? `${a} ${b}` : `${b} ${a}`);
const distance = (a: Vector, b: Vector) => Math.hypot(a.x - b.x, a.y - b.y);

export function nearPairs(placed: Placed[], previous: ReadonlySet<string>, isFree: (point: Vector) => boolean) {
  const freedom = new Map<string, boolean>();
  const free = ({ id, point }: Placed) => {
    if (!freedom.has(id)) freedom.set(id, isFree(point));
    return freedom.get(id);
  };
  const near = new Set<string>();
  placed.forEach((one, index) => {
    for (const other of placed.slice(index + 1)) {
      const pair = pairOf(one.id, other.id);
      if (distance(one.point, other.point) > (previous.has(pair) ? APART : NEAR)) continue;
      if (free(one) && free(other)) near.add(pair);
    }
  });
  return near;
}

export const handsIn = (pairs: ReadonlySet<string>) => new Set([...pairs].flatMap((pair) => pair.split(' ')));

export function createClapWatch() {
  const presses = new Map<string, Timed<Vector>>();

  return (id: string, press: Timed<Vector>, pairs: ReadonlySet<string>): Vector | undefined => {
    for (const [other, earlier] of presses) if (Math.abs(press.at - earlier.at) > TOGETHER) presses.delete(other);
    for (const [other, earlier] of presses) {
      if (!pairs.has(pairOf(id, other))) continue;
      presses.delete(other);
      return { x: (press.value.x + earlier.value.x) / 2, y: (press.value.y + earlier.value.y) / 2 };
    }
    presses.set(id, press);
    return undefined;
  };
}
