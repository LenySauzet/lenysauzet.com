import { describe, expect, it } from 'vitest';

import { blurOf, ghostsOf, poseAt, stepPose, type Pose } from './pose';

const FRAME = 1000 / 60;
const clocks = new WeakMap<Pose, number>();

function run(pose: Pose, frames: number, target: { x: number; y: number }, pressed = false, reducedMotion = false) {
  let now = clocks.get(pose) ?? 0;
  let last = { settled: false, restsIn: undefined as number | undefined };
  for (let index = 0; index < frames; index += 1) {
    now += FRAME;
    last = stepPose(pose, { target, now, elapsed: FRAME, pressed, reducedMotion });
  }
  clocks.set(pose, now);
  return { ...last, now };
}

describe('stepPose', () => {
  it('eases onto its target, then reports itself settled once its fade is done', () => {
    const pose = poseAt({ x: 0, y: 0 }, 0);
    expect(run(pose, 3, { x: 100, y: 0 }).settled).toBe(false);

    const { settled } = run(pose, 240, { x: 100, y: 0 });
    expect(settled).toBe(true);
    expect(pose.shown.x).toBeCloseTo(100, 1);
  });

  it('turns towards its motion while moving, and back once still', () => {
    const pose = poseAt({ x: 0, y: 0 }, 0);
    run(pose, 6, { x: 400, y: 0 });
    expect(pose.tilt).toBeGreaterThan(5);

    run(pose, 240, { x: 400, y: 0 });
    expect(Math.abs(pose.tilt)).toBeLessThan(0.05);
  });

  it('dips while pressed, past its rest, and settles', () => {
    const pose = poseAt({ x: 0, y: 0 }, 0);
    let lowest = 1;
    for (let index = 0; index < 60; index += 1) {
      run(pose, 1, { x: 0, y: 0 }, true);
      lowest = Math.min(lowest, pose.scale.value);
    }
    expect(lowest).toBeLessThan(0.8);
    expect(pose.scale.value).toBeCloseTo(0.8, 2);
  });

  it('fades to a trace a second after it stops, and says when', () => {
    const pose = poseAt({ x: 0, y: 0 }, 0);
    const { restsIn } = run(pose, 1, { x: 0, y: 0 });
    expect(restsIn).toBeGreaterThan(900);

    run(pose, 150, { x: 0, y: 0 });
    expect(pose.opacity).toBeLessThan(0.25);
  });

  it('keeps still under reduced motion: no tilt, no spring, no smear', () => {
    const pose = poseAt({ x: 0, y: 0 }, 0);
    run(pose, 6, { x: 400, y: 0 }, true, true);

    expect(pose.tilt).toBe(0);
    expect(pose.scale).toEqual({ value: 0.8, velocity: 0 });
    expect(ghostsOf(pose, 100, true).every(({ opacity }) => opacity === 0)).toBe(true);
    expect(blurOf(pose, true)).toBe('0 0');
  });
});

describe('ghostsOf', () => {
  it('trails a fast cursor along its recent path, fainter further back', () => {
    const pose = poseAt({ x: 0, y: 0 }, 0);
    const { now } = run(pose, 8, { x: 800, y: 0 });
    const ghosts = ghostsOf(pose, now, false);

    expect(ghosts[0]?.opacity).toBeGreaterThan(ghosts.at(-1)?.opacity ?? Infinity);
    expect(ghosts.every(({ point }) => point.x <= pose.shown.x)).toBe(true);
  });
});
