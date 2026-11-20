import { describe, expect, it } from 'vitest';

import { distribute, laneOf } from './masonry';

const tiles = (...heights: number[]) => heights.map((height, item) => ({ item, height }));

describe('distribute', () => {
  it('fills the shortest column next, the leftmost on a tie', () => {
    expect(distribute(tiles(1, 1, 1, 1), 3)).toEqual([[0, 3], [1], [2]]);
  });

  it('lets a short column catch up under a tall one', () => {
    expect(distribute(tiles(3, 1, 1, 1), 2)).toEqual([[0], [1, 2, 3]]);
  });

  it('keeps the order inside each column', () => {
    expect(distribute(tiles(1, 2, 1, 2, 1), 2)).toEqual([
      [0, 2, 3],
      [1, 4],
    ]);
  });

  it('gives a single column everything, in order', () => {
    expect(distribute(tiles(2, 1, 3), 1)).toEqual([[0, 1, 2]]);
  });

  it('leaves the extra columns empty when there are fewer tiles', () => {
    expect(distribute(tiles(1), 3)).toEqual([[0], [], []]);
  });
});

describe('laneOf', () => {
  it('names the outer lanes, and a single lane first', () => {
    expect([0, 1, 2].map((index) => laneOf(index, 3))).toEqual(['first', undefined, 'last']);
    expect(laneOf(0, 1)).toBe('first');
  });
});
