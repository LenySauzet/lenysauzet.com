import { describe, expect, it } from 'vitest';

import { glowAt, reachAt, strengthAt } from './glow';

const box = { width: 480, height: 420 };
const avatar = { x: 36, y: 330 };

describe('thinking glow', () => {
  it('is all but absent at the very top of the left edge', () => {
    expect(glowAt(0, 0, avatar, box).light).toBeLessThan(0.15);
  });

  it('is already present from the upper third of the panel', () => {
    expect(glowAt(10, box.height / 3, avatar, box).light).toBeGreaterThan(0.2);
  });

  it('widens exponentially on the way down to the avatar', () => {
    const widths = [0, 100, 200, 280, 330].map((y) => reachAt(y, avatar, box));
    for (let index = 1; index < widths.length; index++) expect(widths[index]).toBeGreaterThan(widths[index - 1]!);
    expect(widths[4]! - widths[3]!).toBeGreaterThan(widths[1]! - widths[0]!);
  });

  it('spreads as a wide sheet at the avatar, reaching well toward the middle', () => {
    expect(reachAt(avatar.y, avatar, box)).toBeGreaterThan(box.width * 0.4);
    expect(glowAt(150, avatar.y, avatar, box).light).toBeGreaterThan(0.25);
  });

  it('is brightest at the avatar and fades toward the right', () => {
    const atAvatar = glowAt(avatar.x, avatar.y, avatar, box).light;
    expect(atAvatar).toBeGreaterThan(glowAt(250, avatar.y, avatar, box).light * 2);
    expect(glowAt(440, avatar.y, avatar, box).light).toBeLessThan(0.1);
  });

  it('keeps light toward the bottom-left corner', () => {
    expect(strengthAt(avatar.y + 70, avatar, box)).toBeGreaterThan(0.55);
  });

  it('turns silver at the core and lavender across the sheet', () => {
    const core = glowAt(avatar.x, avatar.y, avatar, box).color;
    const sheet = glowAt(130, avatar.y - 80, avatar, box).color;
    expect(core[1]).toBeGreaterThan(sheet[1]);
    expect(sheet[2] - sheet[1]).toBeGreaterThan(core[2] - core[1]);
  });
});
