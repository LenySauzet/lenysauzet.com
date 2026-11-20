import { describe, expect, it } from 'vitest';

import { anchorFor, fromFraction, toFraction } from './anchors';

const box = { left: 100, top: 400, width: 200, height: 100 };

describe('anchors', () => {
  it('name an element in the alphabet the protocol accepts', () => {
    expect(anchorFor('project', 'Taxi v3 Q-Learning')).toBe('project:taxi-v3-q-learning');
    expect(anchorFor('hero')).toBe('hero');
  });

  it('turn a point into a place within a box, and back', () => {
    const fraction = toFraction(box, { x: 150, y: 475 });

    expect(fraction).toEqual({ x: 0.25, y: 0.75 });
    expect(fromFraction(box, fraction)).toEqual({ x: 150, y: 475 });
  });

  it('place a point on a box of another size where it was on the first', () => {
    const wider = { left: 0, top: 0, width: 800, height: 400 };

    expect(fromFraction(wider, toFraction(box, { x: 200, y: 450 }))).toEqual({ x: 400, y: 200 });
  });

  it('do not divide by a box with no size', () => {
    expect(toFraction({ left: 0, top: 0, width: 0, height: 0 }, { x: 5, y: 5 })).toEqual({ x: 0, y: 0 });
  });
});
