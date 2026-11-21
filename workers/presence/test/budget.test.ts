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

  it('runs up a debt of refusals that pays itself off at the allowed pace', () => {
    const budget = new Budget(1, 10, 0);
    [0, 0, 0].forEach((now) => budget.spend(now));
    expect(budget.overdrawn).toBe(2);

    budget.spend(150);
    expect(budget.overdrawn).toBeCloseTo(0.5);
  });

  it('lets a flood run its debt up despite what trickles in', () => {
    const budget = new Budget(1, 10, 0);
    for (let now = 0; now < 1000; now += 1) budget.spend(now);

    expect(budget.overdrawn).toBeGreaterThan(800);
  });
});
