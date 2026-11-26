import { describe, expect, it } from 'vitest';

import { glowAt, reachAt, strengthAt } from './glow';

const avatar = { x: 36, y: 300 };

describe('thinking glow', () => {
  it('is all but absent at the top of the left edge', () => {
    expect(glowAt(0, 0, avatar).light).toBeLessThan(0.05);
  });

  it('widens exponentially on the way down to the avatar', () => {
    const widths = [0, 100, 200, 260, 300].map((y) => reachAt(y, avatar));
    for (let index = 1; index < widths.length; index++) expect(widths[index]).toBeGreaterThan(widths[index - 1]!);
    expect(widths[4]! - widths[3]!).toBeGreaterThan(widths[1]! - widths[0]!);
  });

  it('is strongest at the avatar and fades fast toward the right', () => {
    const atAvatar = glowAt(avatar.x, avatar.y, avatar).light;
    expect(atAvatar).toBeGreaterThan(glowAt(avatar.x + 120, avatar.y, avatar).light * 3);
    expect(glowAt(300, avatar.y, avatar).light).toBeLessThan(0.02);
  });

  it('keeps some light spreading toward the bottom-left corner', () => {
    expect(strengthAt(avatar.y + 80, avatar)).toBeGreaterThan(0.5);
    expect(glowAt(0, avatar.y + 80, avatar).light).toBeGreaterThan(0.2);
  });

  it('turns silver at the core and lavender further out', () => {
    const core = glowAt(avatar.x, avatar.y, avatar).color;
    const outer = glowAt(110, avatar.y - 60, avatar).color;
    expect(core[1]).toBeGreaterThan(outer[1]);
    expect(outer[2] - outer[1]).toBeGreaterThan(core[2] - core[1]);
  });
});
