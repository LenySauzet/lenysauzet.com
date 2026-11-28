import { describe, expect, it } from 'vitest';

import { startAt, travel, TURN_AFTER } from './travel';

const scroll = (...ys: number[]) => ys.reduce(travel, startAt(500));

describe('travel', () => {
  it('rises once the page has moved up far enough in one direction', () => {
    expect(scroll(500 - TURN_AFTER + 1).rising).toBe(false);
    expect(scroll(500 - TURN_AFTER).rising).toBe(true);
  });

  it('adds small steps in the same direction', () => {
    expect(scroll(496, 492, 488).rising).toBe(true);
  });

  it('sinks again once the page has moved down far enough', () => {
    expect(scroll(400, 400 + TURN_AFTER - 1).rising).toBe(true);
    expect(scroll(400, 400 + TURN_AFTER).rising).toBe(false);
  });

  it('starts counting again when the direction turns', () => {
    expect(scroll(490, 495, 485).rising).toBe(false);
  });
});
