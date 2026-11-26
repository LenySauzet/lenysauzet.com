import { describe, expect, it } from 'vitest';

import { boundaryAt, boundaryPath, glowAt } from './glow';

const D = 30;
const avatar = { x: 36, y: 330, size: D };
const box = { width: 480, height: 420 };

describe('thinking glow boundary, in avatar diameters', () => {
  it('barely leaves the edge two diameters above the avatar', () => {
    expect(boundaryAt(avatar.y - 2 * D, avatar)).toBeLessThan(0.2 * D);
  });

  it('reaches about half a diameter in, one diameter above', () => {
    const reach = boundaryAt(avatar.y - D, avatar) / D;
    expect(reach).toBeGreaterThan(0.45);
    expect(reach).toBeLessThan(0.8);
  });

  it('reaches into the left half of the avatar at its height, and no further', () => {
    const reach = boundaryAt(avatar.y, avatar);
    expect(reach).toBeGreaterThan(avatar.x - D / 2);
    expect(reach).toBeLessThan(avatar.x + D / 4);
  });

  it('rises faster and faster toward the avatar', () => {
    const steps = [-2, -1.5, -1, -0.5].map((k) => boundaryAt(avatar.y + k * D, avatar));
    const gains = steps.slice(1).map((value, index) => value - steps[index]!);
    expect(gains[1]!).toBeGreaterThan(gains[0]!);
  });

  it('tapers below the avatar into a thin line along the edge', () => {
    const below = [1, 2, 3].map((k) => boundaryAt(avatar.y + k * D, avatar) / D);
    expect(below[0]!).toBeGreaterThan(below[1]!);
    expect(below[1]!).toBeGreaterThan(below[2]!);
    expect(below[2]!).toBeLessThan(0.45);
    expect(below[2]!).toBeGreaterThan(0.1);
  });

  it('traces as a path from the top to the bottom of the panel', () => {
    expect(boundaryPath(avatar, box, 20).split('L')).toHaveLength(box.height / 20 + 1);
  });
});

describe('thinking glow light', () => {
  it('is dark a little past the boundary and across the panel', () => {
    const y = avatar.y - D / 2;
    expect(glowAt(boundaryAt(y, avatar) + 0.8 * D, y, avatar).light).toBeLessThan(0.05);
    expect(glowAt(box.width / 3, avatar.y, avatar).light).toBeLessThan(0.01);
  });

  it('is absent high up and brightest between the edge and the avatar', () => {
    expect(glowAt(2, avatar.y - 4 * D, avatar).light).toBeLessThan(0.01);
    const beside = glowAt(avatar.x - D / 2, avatar.y, avatar).light;
    expect(beside).toBeGreaterThan(glowAt(4, avatar.y - 1.5 * D, avatar).light * 2);
    expect(beside).toBeGreaterThan(0.6);
  });

  it('is lavender along the edge and silver at the avatar', () => {
    const edge = glowAt(3, avatar.y + 1.5 * D, avatar).color;
    const core = glowAt(avatar.x, avatar.y, avatar).color;
    expect(edge[2] - edge[1]).toBeGreaterThan(core[2] - core[1]);
    expect(core[1]).toBeGreaterThan(edge[1]);
  });
});
