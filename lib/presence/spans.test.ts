import { describe, expect, it } from 'vitest';

import { continues } from './spans';

const span = (start: number, end: number, anchor = 'intro') => ({ anchor, start, end });

describe('continues', () => {
  it('holds a selection dragged from the same point, either way', () => {
    expect(continues(span(10, 20), span(10, 80))).toBe(true);
    expect(continues(span(10, 20), span(4, 20))).toBe(true);
  });

  it('starts over for a selection made elsewhere, or in another anchor', () => {
    expect(continues(span(10, 20), span(90, 120))).toBe(false);
    expect(continues(span(10, 20), span(10, 20, 'headline'))).toBe(false);
  });
});
