import { describe, expect, it } from 'vitest';

import { breathe, LAYOUTS, rest, SPHERES, step } from './layout';

describe('orb layout', () => {
  it('gives every count the same number of spheres, so any two can be blended', () => {
    for (const layout of Object.values(LAYOUTS)) expect(layout).toHaveLength(SPHERES);
  });

  it('shows as many spheres as its count', () => {
    for (const [count, layout] of Object.entries(LAYOUTS)) {
      expect(layout.filter((sphere) => sphere.a > 0)).toHaveLength(Number(count));
    }
  });

  it('settles on the target layout', () => {
    const bodies = rest(LAYOUTS[1]);
    for (let frame = 0; frame < 600; frame++) step(bodies, LAYOUTS[4], 1 / 60);
    bodies.forEach((body, index) => {
      expect(body.value.x).toBeCloseTo(LAYOUTS[4][index]!.x, 3);
      expect(body.value.r).toBeCloseTo(LAYOUTS[4][index]!.r, 3);
    });
  });

  it('reports motion until it has settled', () => {
    const bodies = rest(LAYOUTS[1]);
    expect(step(bodies, LAYOUTS[2], 1 / 60)).toBe(true);
    for (let frame = 0; frame < 1200; frame++) step(bodies, LAYOUTS[2], 1 / 60);
    expect(step(bodies, LAYOUTS[2], 1 / 60)).toBe(false);
  });

  it('breathes around a sphere without leaving it', () => {
    const sphere = LAYOUTS[2][0]!;
    for (let time = 0; time < 20; time += 0.37) {
      const moved = breathe(sphere, 0, time, 0);
      expect(Math.hypot(moved.x - sphere.x, moved.y - sphere.y)).toBeLessThan(0.03);
      expect(Math.abs(moved.r / sphere.r - 1)).toBeLessThanOrEqual(0.025);
    }
  });
});
