import { afterEach, describe, expect, it, vi } from 'vitest';

import { anchorFor, createPlacer, fromFraction, rangeOf, spanOf, toFraction } from './anchors';

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

const card = (visible: boolean, left: number) => {
  const element = document.createElement('article');
  element.dataset.presence = 'project:ankhora';
  vi.spyOn(element, 'getClientRects').mockReturnValue((visible ? [{}] : []) as unknown as DOMRectList);
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ left, top: 0, width: 100, height: 50 } as DOMRect);
  document.body.append(element);
};

describe('createPlacer', () => {
  afterEach(() => document.body.replaceChildren());

  it('places a cursor on the copy of an element that is shown, not a hidden one', () => {
    card(false, 0);
    card(true, 500);

    expect(createPlacer()({ anchor: 'project:ankhora', x: 0.5, y: 0.5 })).toEqual({ x: 550, y: 25 });
  });

  it('places nothing on an element this page does not have', () => {
    expect(createPlacer()({ anchor: 'project:elsewhere', x: 0.5, y: 0.5 })).toBeUndefined();
  });
});

describe('spans', () => {
  afterEach(() => document.body.replaceChildren());

  const intro = (visible = true) => {
    const element = document.createElement('p');
    element.dataset.presence = 'intro';
    element.innerHTML = 'I am <em>Lény</em>, an engineer.';
    vi.spyOn(element, 'getClientRects').mockReturnValue((visible ? [{}] : []) as unknown as DOMRectList);
    document.body.append(element);
    return element;
  };

  it('turn a selection into characters of its anchor, across inline elements', () => {
    const element = intro();
    const range = document.createRange();
    range.setStart(element.firstChild!, 2);
    range.setEnd(element.querySelector('em')!.firstChild!, 4);

    expect(spanOf(range)).toEqual({ anchor: 'intro', start: 2, end: 9 });
  });

  it('turn those characters back into the same text on another copy of the page', () => {
    intro(false);
    const shown = intro();

    const range = rangeOf({ anchor: 'intro', start: 2, end: 9 });

    expect(range?.toString()).toBe('am Lény');
    expect(shown.contains(range!.startContainer)).toBe(true);
  });

  it('share nothing outside an anchor, and place nothing past its text', () => {
    const loose = document.createElement('div');
    loose.textContent = 'free text';
    document.body.append(loose);
    const range = document.createRange();
    range.selectNodeContents(loose);

    expect(spanOf(range)).toBeUndefined();
    intro();
    expect(rangeOf({ anchor: 'intro', start: 2, end: 500 })).toBeUndefined();
  });
});
