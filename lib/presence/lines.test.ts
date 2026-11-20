import { describe, expect, it } from 'vitest';

import { linesOf, trimEnds } from './lines';

const rect = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });

describe('linesOf', () => {
  it('joins the pieces of one line, an inline element included, and keeps lines apart', () => {
    const lines = linesOf([
      rect(10, 0, 60, 20),
      rect(60, 2, 90, 18),
      rect(0, 24, 40, 44),
      rect(60, 0, 90, 20),
    ]);

    expect(lines).toEqual([rect(10, 0, 90, 20), rect(0, 24, 40, 44)]);
  });

  it('drops pieces with no area', () => {
    expect(linesOf([rect(10, 0, 10, 20), rect(0, 0, 5, 0)])).toEqual([]);
  });
});

describe('trimEnds', () => {
  const lines = [rect(0, 0, 100, 20), rect(0, 24, 80, 44)];

  it('takes the uncovered part of a character off each end', () => {
    expect(trimEnds(lines, { width: 10, part: 0.5 }, { width: 8, part: 0.25 })).toEqual([
      rect(5, 0, 100, 20),
      rect(0, 24, 78, 44),
    ]);
  });

  it('never turns a single line inside out', () => {
    expect(trimEnds([rect(0, 0, 10, 20)], { width: 10, part: 0.9 }, { width: 10, part: 0.9 })).toEqual([
      rect(9, 0, 9, 20),
    ]);
    expect(trimEnds([], { width: 1, part: 1 }, { width: 1, part: 1 })).toEqual([]);
  });
});
