import { describe, expect, it } from 'vitest';

import { createClickJudge } from './clicks';

const press = (at: number, x = 0) => ({ at, value: { x, y: 0 } });
const at = (x: number) => ({ x, y: 0 });

describe('createClickJudge', () => {
  it('takes a press released where it went down, however long it was held', () => {
    expect(createClickJudge()(press(0), at(3), true)).toBe(true);
    expect(createClickJudge()(press(0), at(20), true)).toBe(false);
  });

  it('takes no click that leaves a selection behind', () => {
    expect(createClickJudge()(press(0), at(0), false)).toBe(false);
  });

  it('lets the first click of a double or triple click through, and only that one', () => {
    const judge = createClickJudge();

    expect([0, 200, 380].map((time) => judge(press(time), at(0), true))).toEqual([true, false, false]);
  });

  it('lets clicks through apart in time or in place', () => {
    const judge = createClickJudge();

    expect([judge(press(0), at(0), true), judge(press(500), at(0), true), judge(press(600, 40), at(40), true)]).toEqual(
      [true, true, true]
    );
  });
});
