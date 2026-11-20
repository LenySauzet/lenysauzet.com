export interface Vector {
  x: number;
  y: number;
}

export interface Sample<T> {
  at: number;
  value: T;
}

const TRAIL_LENGTH = 6;
const MAX_TILT = 10;
const TILT_PER_SPEED = 6;
const MAX_BLUR = 1.5;
const BLUR_PER_SPEED = 0.9;
const PRESS_DOWN = 80;
const PRESS_UP = 280;
const PRESSED_SCALE = 0.85;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function catmullRom(p0: Vector, p1: Vector, p2: Vector, p3: Vector, t: number): Vector {
  const t2 = t * t;
  const t3 = t2 * t;
  const along = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);

  return { x: along(p0.x, p1.x, p2.x, p3.x), y: along(p0.y, p1.y, p2.y, p3.y) };
}

export class Trail<T> {
  private readonly samples: Sample<T>[] = [];

  push(sample: Sample<T>) {
    this.samples.push(sample);
    if (this.samples.length > TRAIL_LENGTH) this.samples.shift();
  }

  get last() {
    return this.samples.at(-1);
  }

  at(time: number, resolve: (value: T) => Vector | undefined): Vector | undefined {
    const points = this.samples.flatMap(({ at, value }) => {
      const point = resolve(value);
      return point ? [{ at, point }] : [];
    });
    const after = points.findIndex(({ at }) => at > time);

    if (after === -1) return points.at(-1)?.point;
    if (after === 0) return points[0]?.point;

    const index = (offset: number) => points[clamp(after + offset, 0, points.length - 1)]!;
    const from = index(-1);
    const to = index(0);
    const t = (time - from.at) / (to.at - from.at);

    return catmullRom(index(-2).point, from.point, to.point, index(1).point, t);
  }
}

export const damp = (current: number, target: number, lag: number, elapsed: number) =>
  target + (current - target) * Math.exp(-elapsed / lag);

export const tiltFor = (horizontalSpeed: number) => clamp(horizontalSpeed * TILT_PER_SPEED, -MAX_TILT, MAX_TILT);

export const blurFor = (speed: number) => Math.min(MAX_BLUR, Math.abs(speed) * BLUR_PER_SPEED);

export function pressScaleAfter(elapsed: number) {
  if (elapsed < 0 || elapsed >= PRESS_DOWN + PRESS_UP) return 1;
  if (elapsed < PRESS_DOWN) return 1 - (1 - PRESSED_SCALE) * easeOutCubic(elapsed / PRESS_DOWN);
  return PRESSED_SCALE + (1 - PRESSED_SCALE) * easeOutCubic((elapsed - PRESS_DOWN) / PRESS_UP);
}
