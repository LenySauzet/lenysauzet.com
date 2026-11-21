import { describe, expect, it } from 'vitest';

import type { Vector } from './motion';

import { createClapWatch, handsIn, nearPairs, SELF } from './high-five';

const at = (id: string, x: number) => ({ id, point: { x, y: 0 } });
const everywhere = () => true;

describe('nearPairs', () => {
  it('pairs hands close to each other', () => {
    const pairs = nearPairs([at(SELF, 0), at('a', 30), at('b', 200)], new Set(), everywhere);

    expect(pairs).toEqual(new Set([`${SELF} a`]));
    expect(handsIn(pairs)).toEqual(new Set([SELF, 'a']));
  });

  it('leaves out a hand over an action, and only asks about hands that are close', () => {
    const asked: number[] = [];
    const free = ({ x }: Vector) => {
      asked.push(x);
      return x !== 30;
    };

    expect(nearPairs([at('a', 0), at('b', 30), at('c', 500)], new Set(), free)).toEqual(new Set());
    expect(asked.sort((p, q) => p - q)).toEqual([0, 30]);
  });

  it('keeps a pair a little further apart than it takes to make one, so the hands do not flicker', () => {
    const hands = [at('a', 0), at('b', 42)];

    expect(nearPairs(hands, new Set(), everywhere)).toEqual(new Set());
    expect(nearPairs(hands, new Set(['a b']), everywhere)).toEqual(new Set(['a b']));
    expect(nearPairs([at('a', 0), at('b', 52)], new Set(['a b']), everywhere)).toEqual(new Set());
  });
});

describe('createClapWatch', () => {
  const pairs = new Set(['a b']);
  const press = (time: number, x: number) => ({ at: time, value: { x, y: 0 } });

  it('claps when the two hands of a pair press together, at the middle of their presses', () => {
    const clap = createClapWatch();

    expect(clap('a', press(0, 0), pairs)).toBeUndefined();
    expect(clap('b', press(200, 40), pairs)).toEqual({ x: 20, y: 0 });
  });

  it('claps for presses heard out of order, but not far apart', () => {
    const clap = createClapWatch();
    clap('a', press(500, 0), pairs);
    expect(clap('b', press(300, 40), pairs)).toEqual({ x: 20, y: 0 });

    clap('a', press(2000, 0), pairs);
    expect(clap('b', press(1000, 40), pairs)).toBeUndefined();
  });

  it('claps once per pair of presses', () => {
    const clap = createClapWatch();
    clap('a', press(0, 0), pairs);
    clap('b', press(100, 40), pairs);

    expect(clap('b', press(150, 40), pairs)).toBeUndefined();
  });

  it('does not clap for presses apart in time, or by hands that are not paired', () => {
    const late = createClapWatch();
    late('a', press(0, 0), pairs);
    expect(late('b', press(400, 40), pairs)).toBeUndefined();

    const strangers = createClapWatch();
    strangers('a', press(0, 0), pairs);
    expect(strangers('c', press(50, 40), pairs)).toBeUndefined();
  });
});
