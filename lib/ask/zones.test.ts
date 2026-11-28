import { describe, expect, it } from 'vitest';

import { across, near, STAY_REACH, WAKE_HALF_WIDTH, WAKE_HEIGHT } from './zones';

const bar = { top: 800, left: 480, right: 960 };
const middle = 720;

describe('the bar’s zones', () => {
  it('wakes only in a narrow band over its middle', () => {
    expect(near({ x: middle, y: bar.top - WAKE_HEIGHT + 1 }, bar, false)).toBe(true);
    expect(near({ x: middle, y: bar.top - WAKE_HEIGHT - 1 }, bar, false)).toBe(false);
    expect(near({ x: middle + WAKE_HALF_WIDTH + 1, y: bar.top }, bar, false)).toBe(false);
  });

  it('stays awake further out than it wakes, so it does not flicker at the edge', () => {
    const pointer = { x: bar.right + STAY_REACH - 1, y: bar.top - STAY_REACH + 1 };
    expect(near(pointer, bar, false)).toBe(false);
    expect(near(pointer, bar, true)).toBe(true);
  });

  it('places the shine across the bar, short of its ends', () => {
    expect(across({ x: middle, y: 0 }, bar)).toBe(50);
    expect(across({ x: 0, y: 0 }, bar)).toBe(4);
    expect(across({ x: 2000, y: 0 }, bar)).toBe(96);
  });
});
