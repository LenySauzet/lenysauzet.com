import { describe, expect, it } from 'vitest';

import { continues, planMarks } from './selection';

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

describe('planMarks', () => {
  it('carries a mark that grows, folds one left behind, and begins one newly reached', () => {
    const plan = planMarks([span(0, 12, 'role'), span(10, 20)], [span(10, 60), span(0, 30, 'headline')]);

    expect(plan).toEqual({ carry: [span(10, 60)], fold: ['role'], begin: [span(0, 30, 'headline')] });
  });

  it('folds and begins again a mark replaced by an unrelated selection in its anchor', () => {
    expect(planMarks([span(10, 20)], [span(90, 120)])).toEqual({
      carry: [],
      fold: ['intro'],
      begin: [span(90, 120)],
    });
  });
});
