export interface Vector {
  x: number;
  y: number;
}

export interface Timed<T> {
  at: number;
  value: T;
}

export interface Spring {
  value: number;
  velocity: number;
}

const TRAIL_LENGTH = 24;
const MAX_TILT = 34;
const TILT_PER_SPEED = 34;
const MAX_BLUR = 7;
const BLUR_PER_SPEED = 5;
const SPRING_STEP = 1;
const FIRST_INTERVAL = 33;
const FIRST_JITTER = 8;
const PAUSE = 250;
const RESUMING = 10;
const LEARNING = 0.1;
const SHORTEST_DELAY = 40;
const LONGEST_DELAY = 160;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function catmullRom(p0: Vector, p1: Vector, p2: Vector, p3: Vector, t: number): Vector {
  const t2 = t * t;
  const t3 = t2 * t;
  const along = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);

  return { x: along(p0.x, p1.x, p2.x, p3.x), y: along(p0.y, p1.y, p2.y, p3.y) };
}

export class Trail<T> {
  private readonly samples: Timed<T>[] = [];

  push(sample: Timed<T>) {
    let index = this.samples.length;
    while (index > 0 && (this.samples[index - 1]?.at ?? -Infinity) > sample.at) index -= 1;
    this.samples.splice(index, 0, sample);
    if (this.samples.length > TRAIL_LENGTH) this.samples.shift();
  }

  get latest() {
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
    const start = index(-1);
    const end = index(0);
    const t = (time - start.at) / (end.at - start.at);

    return catmullRom(index(-2).point, start.point, end.point, index(1).point, t);
  }
}

export class Cadence {
  private interval = FIRST_INTERVAL;
  private jitter = FIRST_JITTER;
  private heardAt: number | undefined;

  hear(at: number, oldest: number) {
    const gap = this.heardAt === undefined ? Infinity : at - this.heardAt;
    this.heardAt = at;
    if (gap > PAUSE || oldest < RESUMING) return;
    const error = gap - this.interval;
    this.interval += error * LEARNING;
    this.jitter += (Math.abs(error) - this.jitter) * LEARNING;
  }

  get delay() {
    return clamp(this.interval + 2.5 * this.jitter, SHORTEST_DELAY, LONGEST_DELAY);
  }
}

export function lineAt(history: Timed<Vector>[], time: number): Vector | undefined {
  const after = history.findIndex(({ at }) => at > time);
  if (after === -1) return history.at(-1)?.value;
  if (after === 0) return history[0]?.value;
  const from = history[after - 1]!;
  const to = history[after]!;
  const t = (time - from.at) / (to.at - from.at);
  return { x: from.value.x + (to.value.x - from.value.x) * t, y: from.value.y + (to.value.y - from.value.y) * t };
}

export const damp = (current: number, target: number, lag: number, elapsed: number) =>
  target + (current - target) * Math.exp(-elapsed / lag);

export function spring(
  { value, velocity }: Spring,
  target: number,
  elapsed: number,
  { stiffness, damping }: { stiffness: number; damping: number }
): Spring {
  const steps = Math.max(1, Math.ceil(elapsed / SPRING_STEP));
  const step = elapsed / steps / 1000;
  for (let index = 0; index < steps; index += 1) {
    velocity += (-stiffness * (value - target) - damping * velocity) * step;
    value += velocity * step;
  }
  return { value, velocity };
}

export const tiltFor = ({ x, y }: Vector) => clamp(((x - y) / Math.SQRT2) * TILT_PER_SPEED, -MAX_TILT, MAX_TILT);

export const blurFor = (speed: number) => Math.min(MAX_BLUR, Math.abs(speed) * BLUR_PER_SPEED);
