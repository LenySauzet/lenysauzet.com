import type { Timed, Vector } from './motion';

const SLOP = 8;
const REPEAT_WITHIN = 400;
const REPEAT_SLOP = 10;

const apart = (a: Vector, b: Vector) => Math.hypot(a.x - b.x, a.y - b.y);

export function createClickJudge() {
  let last: Timed<Vector> | undefined;
  return (press: Timed<Vector>, release: Vector, selectionCollapsed: boolean) => {
    if (apart(press.value, release) >= SLOP || !selectionCollapsed) return false;
    const repeated =
      last !== undefined && press.at - last.at < REPEAT_WITHIN && apart(press.value, last.value) < REPEAT_SLOP;
    last = press;
    return !repeated;
  };
}
