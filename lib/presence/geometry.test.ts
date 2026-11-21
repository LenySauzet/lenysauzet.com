import { describe, expect, it } from 'vitest';

import { anchorFor, nearest, placeOn, pointOn } from './geometry';

const box = { left: 100, top: 400, width: 200, height: 100 };

describe('anchors', () => {
  it('name an element in the alphabet the protocol accepts', () => {
    expect(anchorFor('project', 'Taxi v3 Q-Learning')).toBe('project:taxi-v3-q-learning');
    expect(anchorFor('intro')).toBe('intro');
  });

  it('place a point inside a box by where it falls, and back', () => {
    const placement = placeOn(box, { x: 150, y: 475 });

    expect(placement).toEqual({ x: 0.25, y: 0.75, dx: 0, dy: 0 });
    expect(pointOn(box, placement)).toEqual({ x: 150, y: 475 });
  });

  it('place a point inside a box of another size where it was on the first', () => {
    const wider = { left: 0, top: 0, width: 800, height: 400 };

    expect(pointOn(wider, placeOn(box, { x: 200, y: 450 }))).toEqual({ x: 400, y: 200 });
  });

  it('keep a point outside a box at the same distance from it, whatever its size', () => {
    const below = placeOn(box, { x: 200, y: 540 });
    const wider = { left: 0, top: 0, width: 800, height: 400 };

    expect(below).toEqual({ x: 0.5, y: 1, dx: 0, dy: 40 });
    expect(pointOn(wider, below)).toEqual({ x: 400, y: 440 });
  });

  it('do not divide by a box with no size', () => {
    expect(placeOn({ left: 0, top: 0, width: 0, height: 0 }, { x: 5, y: 5 })).toEqual({ x: 0, y: 0, dx: 5, dy: 5 });
  });

  it('choose the closest box, and the smallest of those holding the point', () => {
    const card = { anchor: 'card', box };
    const below = { anchor: 'below', box: { left: 100, top: 600, width: 200, height: 100 } };
    const inner = { anchor: 'inner', box: { left: 120, top: 420, width: 20, height: 20 } };

    expect(nearest([card, below], { x: 200, y: 540 })).toBe(card);
    expect(nearest([card, below], { x: 200, y: 580 })).toBe(below);
    expect(nearest([card, inner], { x: 130, y: 430 })).toBe(inner);
    expect(nearest([], { x: 0, y: 0 })).toBeUndefined();
  });
});
