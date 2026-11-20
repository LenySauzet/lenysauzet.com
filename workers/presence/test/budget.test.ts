import { describe, expect, it } from 'vitest';

import { Budget } from '../src/budget';

describe('Budget', () => {
  it('allows a burst, then only what refills', () => {
    const budget = new Budget(3, 10, 0);

    expect([0, 0, 0, 0].map((now) => budget.spend(now))).toEqual([true, true, true, false]);
    expect(budget.spend(50)).toBe(false);
    expect(budget.spend(100)).toBe(true);
  });

  it('never saves up more than its capacity', () => {
    const budget = new Budget(2, 10, 0);

    expect([60_000, 60_000, 60_000].map((now) => budget.spend(now))).toEqual([true, true, false]);
  });
});
