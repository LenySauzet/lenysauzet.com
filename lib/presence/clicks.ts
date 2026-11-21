import type { Timed, Vector } from './motion';

const REPEAT_WITHIN = 400;
const REPEAT_SLOP = 10;

export function createClickFilter() {
  let last: Timed<Vector> | undefined;
  return (click: Timed<Vector>) => {
    const repeated =
      last !== undefined &&
      click.at - last.at < REPEAT_WITHIN &&
      Math.hypot(click.value.x - last.value.x, click.value.y - last.value.y) < REPEAT_SLOP;
    last = click;
    return !repeated;
  };
}
