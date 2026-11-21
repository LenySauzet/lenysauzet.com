import { describe, expect, it } from 'vitest';

import { rubberBand } from './motion';

describe('rubberBand', () => {
  it('gives a little at first, ever less, and never past its limit', () => {
    const near = rubberBand(10, 48);
    const far = rubberBand(200, 48);

    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(10);
    expect(far - rubberBand(100, 48)).toBeLessThan(rubberBand(100, 48) - near);
    expect(rubberBand(1e6, 48)).toBeLessThan(48);
  });

  it('pulls the same both ways and rests at zero', () => {
    expect(rubberBand(-30, 48)).toBeCloseTo(-rubberBand(30, 48));
    expect(rubberBand(0, 48)).toBe(0);
  });
});
