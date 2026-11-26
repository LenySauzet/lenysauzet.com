import { describe, expect, it } from 'vitest';

import { depthAt, glowAt, guidePath } from './glow';

const D = 30;
const avatar = { x: 50, y: 330, size: D };

describe('the edge glow', () => {
  it('is brightest on the edge at the avatar and fades to the right', () => {
    const across = [0, 10, 20, 40, 80].map((x) => glowAt(x, avatar.y, avatar).light);
    for (let index = 1; index < across.length; index++) expect(across[index]!).toBeLessThan(across[index - 1]!);
    expect(across[4]!).toBeLessThan(0.02);
  });

  it('fades smoothly up and down the edge', () => {
    const above = [0, 1, 2, 4, 6].map((k) => glowAt(0, avatar.y - k * D, avatar).light);
    const below = [0, 1, 2, 4, 6].map((k) => glowAt(0, avatar.y + k * D, avatar).light);
    for (let index = 1; index < above.length; index++) {
      expect(above[index]!).toBeLessThan(above[index - 1]!);
      expect(below[index]!).toBeLessThan(below[index - 1]!);
    }
    expect(above[4]!).toBeLessThan(0.05);
  });

  it('reaches furthest in at the avatar, a soft curve and no further than its edge', () => {
    expect(depthAt(avatar.y, avatar)).toBeGreaterThan(depthAt(avatar.y - 2 * D, avatar));
    expect(depthAt(avatar.y, avatar)).toBeLessThan(avatar.x - D / 2);
  });

  it('stays measured', () => {
    expect(glowAt(0, avatar.y, avatar).light).toBeLessThanOrEqual(0.7);
  });

  it('is silver at its heart and lavender at its ends', () => {
    const [, hg, hb] = glowAt(0, avatar.y, avatar).color;
    const [, eg, eb] = glowAt(0, avatar.y - 3 * D, avatar).color;
    expect(eb - eg).toBeGreaterThan(hb - hg);
  });

  it('traces its curve for debugging', () => {
    expect(guidePath(avatar, { width: 480, height: 420 }, 20).split('L')).toHaveLength(22);
  });
});
