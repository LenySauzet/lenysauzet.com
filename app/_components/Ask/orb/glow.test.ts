import { describe, expect, it } from 'vitest';

import { archAt, edgeAt, glowAt, guidePath } from './glow';

const D = 30;
const avatar = { x: 50, y: 330, size: D };

describe('the edge light', () => {
  it('hugs the left edge and is gone within about a diameter', () => {
    expect(edgeAt(0, avatar.y, avatar)).toBeGreaterThan(0.45);
    expect(edgeAt(D, avatar.y, avatar)).toBeLessThan(0.1);
    expect(edgeAt(1.5 * D, avatar.y, avatar)).toBeLessThan(0.03);
  });

  it('starts above the avatar and runs down to the bottom', () => {
    expect(edgeAt(0, avatar.y - 3.5 * D, avatar)).toBeLessThan(0.01);
    expect(edgeAt(0, avatar.y - 2 * D, avatar)).toBeGreaterThan(0.2);
    expect(edgeAt(0, avatar.y - 0.5 * D, avatar)).toBeGreaterThan(0.45);
    expect(edgeAt(0, avatar.y + 4 * D, avatar)).toBeGreaterThan(0.45);
  });
});

describe('the arch between the edge and the avatar', () => {
  it('only goes left, toward the edge', () => {
    expect(archAt(avatar.x + 10, avatar.y, avatar)).toBe(0);
    expect(archAt(avatar.x - 10, avatar.y, avatar)).toBeGreaterThan(0.3);
  });

  it('is an arch: taller at the edge, rounding off at the avatar', () => {
    const height = (x: number) => {
      let lit = 0;
      for (let y = avatar.y - 3 * D; y <= avatar.y + 3 * D; y++) if (archAt(x, y, avatar) > 0.2) lit++;
      return lit;
    };
    expect(height(5)).toBeGreaterThan(height(avatar.x - 10) * 2);
  });

  it('is brightest beside the avatar and dimmer at the edge', () => {
    expect(archAt(avatar.x - 8, avatar.y, avatar)).toBeGreaterThan(archAt(2, avatar.y, avatar));
  });
});

describe('the glow together', () => {
  it('is dark to the right of the avatar and high above it', () => {
    expect(glowAt(avatar.x + 40, avatar.y, avatar).light).toBeLessThan(0.001);
    expect(glowAt(10, avatar.y - 3 * D, avatar).light).toBeLessThan(0.02);
  });

  it('keeps its colours apart: lavender on the edge, silver in the beam', () => {
    const [er, eg, eb] = glowAt(1, avatar.y - D, avatar).color;
    const [br, bg, bb] = glowAt(avatar.x - 12, avatar.y, avatar).color;
    expect(eb - eg).toBeGreaterThan(0.1);
    expect(Math.abs(bb - bg)).toBeLessThan(0.05);
    expect(Math.min(br, bg)).toBeGreaterThan(Math.min(er, eg));
  });

  it('draws its guides: the arch and the edge line', () => {
    expect(guidePath(avatar, { width: 480, height: 420 }).match(/M/g)).toHaveLength(2);
  });
});
