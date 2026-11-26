import { describe, expect, it } from 'vitest';

import { glowAt, guidePath, haloAt, rimAt } from './glow';

const D = 30;
const avatar = { x: 50, y: 330, size: D };

describe('the rim', () => {
  it('hugs the left edge', () => {
    expect(rimAt(0, avatar.y, avatar)).toBeGreaterThan(5 * rimAt(D, avatar.y, avatar));
  });

  it('climbs the edge progressively above the avatar', () => {
    const climb = [0, 1, 2, 3, 4].map((k) => rimAt(0, avatar.y - k * D, avatar));
    for (let index = 1; index < climb.length; index++) expect(climb[index]!).toBeLessThan(climb[index - 1]!);
    expect(climb[2]!).toBeGreaterThan(climb[0]! * 0.7);
  });
});

describe('the halo', () => {
  it('sits on the avatar, leaning toward the edge', () => {
    expect(haloAt(avatar.x - 0.5 * D, avatar.y, avatar)).toBeGreaterThan(haloAt(avatar.x + 0.5 * D, avatar.y, avatar));
  });

  it('is gone a little way to the right of the avatar', () => {
    expect(haloAt(avatar.x + 2 * D, avatar.y, avatar)).toBeLessThan(0.01);
  });
});

describe('the glow', () => {
  it('never saturates, so it keeps its gradient', () => {
    for (let x = 0; x <= 3 * D; x += 2) {
      for (let y = avatar.y - 3 * D; y <= avatar.y + 3 * D; y += 2) expect(glowAt(x, y, avatar).light).toBeLessThan(0.85);
    }
  });

  it('has no hard edge: neighbouring points never jump', () => {
    for (let x = 0; x <= 3 * D; x += 1) {
      for (let y = avatar.y - 3 * D; y <= avatar.y + 3 * D; y += 3) {
        expect(Math.abs(glowAt(x + 1, y, avatar).light - glowAt(x, y, avatar).light)).toBeLessThan(0.04);
      }
    }
  });

  it('is lavender on the edge and silver around the avatar', () => {
    const [, eg, eb] = glowAt(0, avatar.y - 2 * D, avatar).color;
    const [hr, hg, hb] = glowAt(avatar.x - 0.4 * D, avatar.y, avatar).color;
    expect(eb - eg).toBeGreaterThan(0.12);
    expect(hb - hg).toBeLessThan(0.08);
    expect(Math.min(hr, hg)).toBeGreaterThan(eg);
  });

  it('draws its guides', () => {
    expect(guidePath(avatar, { width: 480, height: 420 }).match(/M/g)).toHaveLength(2);
  });
});
