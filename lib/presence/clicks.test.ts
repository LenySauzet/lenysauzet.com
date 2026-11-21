import { describe, expect, it } from 'vitest';

import { createClickFilter } from './clicks';

const click = (at: number, x = 0) => ({ at, value: { x, y: 0 } });

describe('createClickFilter', () => {
  it('lets the first click of a double or triple click through, and only that one', () => {
    const fresh = createClickFilter();

    expect([fresh(click(0)), fresh(click(200)), fresh(click(380))]).toEqual([true, false, false]);
  });

  it('lets clicks through apart in time or in place', () => {
    const fresh = createClickFilter();

    expect([fresh(click(0)), fresh(click(500)), fresh(click(600, 40))]).toEqual([true, true, true]);
  });
});
