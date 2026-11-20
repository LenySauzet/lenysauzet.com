import { describe, expect, it } from 'vitest';

import { blurFor, catmullRom, damp, pressScaleAfter, tiltFor, Trail, type Vector } from './motion';

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
    for (const [time, x] of [[0, 0], [100, 10], [200, 20], [300, 30]]) trail.push({ at: time!, value: at(x!) });

    expect(trail.at(150, identity)!.x).toBeCloseTo(15);
  });

  it('skips a sample it cannot place', () => {
    const trail = new Trail<Vector | null>();
    trail.push({ at: 0, value: at(0) });
    trail.push({ at: 100, value: null });

    expect(trail.at(500, (point) => point ?? undefined)).toEqual(at(0));
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

describe('the motion of a cursor', () => {
  it('tilts with its horizontal speed, within bounds', () => {
    expect(tiltFor(0)).toBe(0);
    expect(tiltFor(0.5)).toBeGreaterThan(0);
    expect(tiltFor(-50)).toBe(-10);
  });

  it('blurs lightly with speed, never more than its cap', () => {
    expect(blurFor(0)).toBe(0);
    expect(blurFor(-1)).toBeGreaterThan(0);
    expect(blurFor(50)).toBe(1.5);
  });

  it('dips when pressed and settles back', () => {
    expect(pressScaleAfter(0)).toBe(1);
    expect(pressScaleAfter(80)).toBeCloseTo(0.85);
    expect(pressScaleAfter(200)).toBeGreaterThan(0.85);
    expect(pressScaleAfter(360)).toBe(1);
    expect(pressScaleAfter(-1)).toBe(1);
  });
});
