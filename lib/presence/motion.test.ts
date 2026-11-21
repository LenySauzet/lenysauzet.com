import { describe, expect, it } from 'vitest';

import { blurFor, Cadence, catmullRom, damp, lineAt, spring, tiltFor, Trail, type Vector } from './motion';

const at = (x: number, y = 0): Vector => ({ x, y });
const identity = (point: Vector) => point;

describe('catmullRom', () => {
  it('passes through its inner points', () => {
    expect(catmullRom(at(0), at(10), at(20), at(30), 0)).toEqual(at(10));
    expect(catmullRom(at(0), at(10), at(20), at(30), 1)).toEqual(at(20));
  });

  it('curves through a corner rather than cutting it', () => {
    const midway = catmullRom(at(0, 0), at(10, 0), at(10, 10), at(10, 20), 0.5);

    expect(midway.x).toBeGreaterThan(10);
  });
});

describe('Trail', () => {
  it('holds the latest point once time runs past it, and the first before', () => {
    const trail = new Trail<Vector>();
    trail.push({ at: 100, value: at(0) });
    trail.push({ at: 200, value: at(10) });

    expect(trail.at(50, identity)).toEqual(at(0));
    expect(trail.at(500, identity)).toEqual(at(10));
  });

  it('interpolates between the samples around the time asked', () => {
    const trail = new Trail<Vector>();
    for (const [time, x] of [
      [0, 0],
      [100, 10],
      [200, 20],
      [300, 30],
    ])
      trail.push({ at: time!, value: at(x!) });

    expect(trail.at(150, identity)!.x).toBeCloseTo(15);
  });

  it('keeps samples in time order when a batch arrives late', () => {
    const trail = new Trail<Vector>();
    trail.push({ at: 200, value: at(20) });
    trail.push({ at: 100, value: at(10) });

    expect(trail.latest?.at).toBe(200);
    expect(trail.at(150, identity)!.x).toBeCloseTo(15);
  });

  it('skips a sample it cannot place', () => {
    const trail = new Trail<Vector | null>();
    trail.push({ at: 0, value: at(0) });
    trail.push({ at: 100, value: null });

    expect(trail.at(500, (point) => point ?? undefined)).toEqual(at(0));
  });
});

describe('Cadence', () => {
  it('waits a little longer than messages take to come', () => {
    const steady = new Cadence();
    for (let time = 0; time < 2000; time += 33) steady.hear(time, 30);

    expect(steady.delay).toBeGreaterThanOrEqual(40);
    expect(steady.delay).toBeLessThan(50);
  });

  it('waits longer for a connection that stutters, within bounds', () => {
    const shaky = new Cadence();
    for (let time = 0, index = 0; time < 4000; index += 1) {
      shaky.hear(time, 30);
      time += index % 2 ? 10 : 90;
    }

    expect(shaky.delay).toBeGreaterThan(100);
    expect(shaky.delay).toBeLessThanOrEqual(160);
  });

  it('does not count a pause, or the batch that ends one, as a slow message', () => {
    const paused = new Cadence();
    for (let time = 0; time < 1000; time += 33) paused.hear(time, 30);
    const before = paused.delay;

    paused.hear(10_000, 30);
    paused.hear(10_120, 0);

    expect(paused.delay).toBe(before);
  });
});

describe('lineAt', () => {
  it('reads a straight line between recorded positions', () => {
    const history = [
      { at: 0, value: at(0) },
      { at: 10, value: at(10, 20) },
    ];

    expect(lineAt(history, 5)).toEqual(at(5, 10));
    expect(lineAt(history, -5)).toEqual(at(0));
    expect(lineAt(history, 50)).toEqual(at(10, 20));
    expect(lineAt([], 0)).toBeUndefined();
  });
});

describe('damp', () => {
  it('eases toward its target without overshooting, whatever the frame rate', () => {
    const sixty = [...Array(6)].reduce((value: number) => damp(value, 100, 70, 1000 / 60), 0);
    const oneTwenty = [...Array(12)].reduce((value: number) => damp(value, 100, 70, 1000 / 120), 0);

    expect(sixty).toBeCloseTo(oneTwenty, 6);
    expect(sixty).toBeLessThan(100);
    expect(damp(99.99, 100, 70, 10_000)).toBeCloseTo(100);
  });
});

describe('spring', () => {
  const press = { stiffness: 420, damping: 24 };
  const run = (frame: number, frames: number) => {
    let state = { value: 1, velocity: 0 };
    let lowest = 1;
    for (let index = 0; index < frames; index += 1) {
      state = spring(state, 0.8, frame, press);
      lowest = Math.min(lowest, state.value);
    }
    return { state, lowest };
  };

  it('overshoots a little before it settles', () => {
    const { state, lowest } = run(1000 / 60, 90);

    expect(lowest).toBeLessThan(0.8);
    expect(lowest).toBeGreaterThan(0.76);
    expect(state.value).toBeCloseTo(0.8, 3);
  });

  it('moves the same whatever the frame rate', () => {
    expect(run(1000 / 60, 6).state.value).toBeCloseTo(run(1000 / 120, 12).state.value, 3);
  });
});

describe('the motion of a cursor', () => {
  it('turns its tip towards where it goes, within bounds', () => {
    expect(tiltFor(at(0))).toBe(0);
    expect(tiltFor(at(0.5))).toBeGreaterThan(10);
    expect(tiltFor(at(0, -0.5))).toBeGreaterThan(10);
    expect(tiltFor(at(-0.5))).toBeLessThan(-10);
    expect(tiltFor(at(0, 0.5))).toBeLessThan(-10);
    expect(tiltFor(at(-50))).toBe(-34);
  });

  it('stays put when it already goes where its tip points', () => {
    expect(tiltFor(at(-0.5, -0.5))).toBeCloseTo(0);
  });

  it('blurs with speed, never more than its cap', () => {
    expect(blurFor(0)).toBe(0);
    expect(blurFor(-0.5)).toBeGreaterThan(2);
    expect(blurFor(50)).toBe(7);
  });
});
