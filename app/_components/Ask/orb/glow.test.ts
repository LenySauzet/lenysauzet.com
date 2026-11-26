import { describe, expect, it } from 'vitest';

import { boundaryAt, boundaryPath, glowAt, strengthAt } from './glow';

const D = 30;
const avatar = { x: 36, y: 330, size: D };
const box = { width: 480, height: 420 };

describe('thinking glow boundary, in avatar diameters', () => {
  it('narrows to the edge far above the avatar', () => {
    expect(boundaryAt(avatar.y - 4 * D, avatar) / D).toBeLessThan(0.15);
  });

  it('narrows and dims together above the avatar, so the lit edge is one arch', () => {
    for (const k of [0.5, 1, 2, 3]) {
      const y = avatar.y - k * D;
      const width = boundaryAt(y, avatar) / boundaryAt(avatar.y, avatar);
      const strength = strengthAt(y, avatar);
      expect(Math.abs(width - strength)).toBeLessThan(0.02);
    }
  });

  it('reaches into the left half of the avatar at its height, and no further', () => {
    const reach = boundaryAt(avatar.y, avatar);
    expect(reach).toBeGreaterThan(avatar.x - D / 2);
    expect(reach).toBeLessThan(avatar.x + D / 4);
  });

  it('is smooth through the avatar: no jump and no kink', () => {
    const at = (k: number) => boundaryAt(avatar.y + k * D, avatar);
    const h = 0.001;
    expect(Math.abs(at(-h) - at(h))).toBeLessThan(0.01);
    const slopeAbove = (at(0) - at(-h)) / h;
    const slopeBelow = (at(h) - at(0)) / h;
    expect(Math.abs(slopeAbove - slopeBelow)).toBeLessThan(0.1);
    const strength = (k: number) => strengthAt(avatar.y + k * D, avatar);
    expect(Math.abs((strength(0) - strength(-h)) / h - (strength(h) - strength(0)) / h)).toBeLessThan(0.1);
  });

  it('tapers below the avatar back to the edge line', () => {
    const below = [1, 2, 3].map((k) => boundaryAt(avatar.y + k * D, avatar) / D);
    expect(below[0]!).toBeGreaterThan(below[1]!);
    expect(below[1]!).toBeGreaterThan(below[2]!);
    expect(below[2]!).toBeLessThan(0.4);
  });

  it('traces as a path from the top to the bottom of the panel', () => {
    expect(boundaryPath(avatar, box, 20).split('L')).toHaveLength(box.height / 20 + 1);
  });
});

describe('thinking glow light', () => {
  it('fades monotonically away from the edge, with no ridge at the boundary', () => {
    const y = avatar.y - 2.5 * D;
    let previous = Infinity;
    for (let x = 0; x <= 4 * D; x += 1) {
      const light = glowAt(x, y, avatar).light;
      expect(light).toBeLessThanOrEqual(previous + 1e-9);
      previous = light;
    }
  });

  it('climbs the left edge well above the avatar, fading progressively', () => {
    const along = [0.5, 1.5, 2.5, 3.5].map((k) => glowAt(2, avatar.y - k * D, avatar).light);
    expect(along[2]!).toBeGreaterThan(0.2);
    for (let index = 1; index < along.length; index++) expect(along[index]!).toBeLessThan(along[index - 1]!);
  });

  it('is dark across the panel', () => {
    expect(glowAt(box.width / 3, avatar.y, avatar).light).toBeLessThan(0.01);
  });

  it('is lavender along the edge and silver at the avatar', () => {
    const [er, eg, eb] = glowAt(2, avatar.y - 1.5 * D, avatar).color;
    const [cr, cg, cb] = glowAt(avatar.x - D / 3, avatar.y, avatar).color;
    expect(eb - eg).toBeGreaterThan(0.15);
    expect(cb - cg).toBeLessThan(0.1);
    expect(Math.min(cr, cg)).toBeGreaterThan(Math.min(er, eg));
  });
});
