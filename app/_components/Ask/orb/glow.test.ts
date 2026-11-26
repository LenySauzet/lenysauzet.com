import { describe, expect, it } from 'vitest';

import { boundaryAt, boundaryPath, glowAt } from './glow';

const box = { width: 480, height: 420 };
const avatar = { x: 36, y: 330 };

describe('thinking glow boundary', () => {
  it('hugs the left edge at the top', () => {
    expect(boundaryAt(0, avatar, box)).toBeLessThan(15);
  });

  it('reaches furthest in at the avatar, just past it', () => {
    const atAvatar = boundaryAt(avatar.y, avatar, box);
    expect(atAvatar).toBeGreaterThan(avatar.x);
    for (const y of [0, 100, 200, 300, 360, 400]) expect(boundaryAt(y, avatar, box)).toBeLessThanOrEqual(atAvatar);
  });

  it('advances concavely, faster and faster, on the way down to the avatar', () => {
    const steps = [130, 190, 250, 310].map((y) => boundaryAt(y, avatar, box));
    const gains = steps.slice(1).map((value, index) => value - steps[index]!);
    expect(gains[1]!).toBeGreaterThan(gains[0]!);
    expect(gains[2]!).toBeGreaterThan(gains[1]!);
  });

  it('recedes quickly below the avatar', () => {
    expect(boundaryAt(avatar.y + 60, avatar, box)).toBeLessThan(boundaryAt(avatar.y, avatar, box) / 2);
  });

  it('traces as a path from the top to the bottom of the panel', () => {
    const path = boundaryPath(avatar, box, 20);
    expect(path.startsWith('M')).toBe(true);
    expect(path.split('L')).toHaveLength(box.height / 20 + 1);
  });
});

describe('thinking glow light', () => {
  it('is dark just past the boundary and in the middle of the panel', () => {
    const reach = boundaryAt(avatar.y - 40, avatar, box);
    expect(glowAt(reach + 70, avatar.y - 40, avatar, box).light).toBeLessThan(0.05);
    expect(glowAt(box.width / 2, avatar.y, avatar, box).light).toBeLessThan(0.01);
  });

  it('is barely there at the top and radiates from the avatar', () => {
    const atAvatar = glowAt(avatar.x, avatar.y, avatar, box).light;
    expect(glowAt(2, 10, avatar, box).light).toBeLessThan(0.02);
    expect(atAvatar).toBeGreaterThan(glowAt(4, avatar.y - 90, avatar, box).light * 2);
    expect(atAvatar).toBeGreaterThan(glowAt(4, avatar.y + 60, avatar, box).light * 1.5);
    expect(atAvatar).toBeLessThan(0.6);
  });

  it('is lavender along the edge and silver at the avatar', () => {
    const edge = glowAt(3, avatar.y - 90, avatar, box).color;
    const core = glowAt(avatar.x, avatar.y, avatar, box).color;
    expect(edge[2] - edge[1]).toBeGreaterThan(core[2] - core[1]);
    expect(core[1]).toBeGreaterThan(edge[1]);
  });
});
