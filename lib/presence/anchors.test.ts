import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { anchorFor, createPlacer, locate, nearest, placeOn, pointOn, rangeOf, spansOf } from './anchors';

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

const card = (visible: boolean, left: number, top = 0) => {
  const element = document.createElement('article');
  element.dataset.presence = 'project:ankhora';
  element.innerHTML = '<div><img alt=""><a>View code</a></div>';
  vi.spyOn(element, 'getClientRects').mockReturnValue((visible ? [{}] : []) as unknown as DOMRectList);
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ left, top, width: 100, height: 50 } as DOMRect);
  const button = element.querySelector('a')!;
  vi.spyOn(button, 'getClientRects').mockReturnValue((visible ? [{}] : []) as unknown as DOMRectList);
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ left: left + 10, top: top + 30, width: 80, height: 20 } as DOMRect);
  document.body.append(element);
  return element;
};

describe('locate and place', () => {
  let under: Element | null;

  beforeEach(() => {
    under = null;
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1000);
    document.elementFromPoint = () => under;
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('move on the anchor, and name the deepest element under the pointer as a detail', () => {
    card(false, 0);
    under = card(true, 500).querySelector('a');

    expect(locate([{ x: 530, y: 40 }])).toEqual({
      anchor: 'project:ankhora',
      placements: [{ x: 0.3, y: 0.8, dx: 0, dy: 0 }],
      detail: { part: '0.1', x: 0.25, y: 0.5, width: 80, height: 20 },
    });
  });

  it('stay on the element last left while crossing empty space', () => {
    card(true, 500);
    const far = card(true, 0);
    far.dataset.presence = 'project:far';

    expect(locate([{ x: 550, y: 200 }], 'project:ankhora')).toEqual({
      anchor: 'project:ankhora',
      placements: [{ x: 0.5, y: 1, dx: 0, dy: 150 }],
    });
  });

  it('start from the element closest to the pointer when none was left', () => {
    card(false, 0);
    card(true, 500);

    expect(locate([{ x: 400, y: 25 }, { x: 550, y: 80 }])).toEqual({
      anchor: 'project:ankhora',
      placements: [
        { x: 0, y: 0.5, dx: -100, dy: 0 },
        { x: 0.5, y: 1, dx: 0, dy: 30 },
      ],
    });
  });

  it('aim at the character under the pointer, on whatever line it wraps to', () => {
    const intro = document.createElement('p');
    intro.dataset.presence = 'intro';
    intro.textContent = 'Hello';
    vi.spyOn(intro, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    document.body.append(intro);
    under = intro;
    const text = intro.firstChild!;
    document.caretPositionFromPoint = () => ({ offsetNode: text, offset: 2 }) as unknown as CaretPosition;
    Range.prototype.getClientRects = function (this: Range) {
      const left = 100 + this.startOffset * 10;
      return [{ left, top: 0, right: left + 10, bottom: 20, width: 10, height: 20 }] as unknown as DOMRectList;
    };

    const located = locate([{ x: 116, y: 10 }]);

    expect(located?.anchor).toBe('intro');
    expect(located?.detail).toEqual({ part: '#1', x: 0.6, y: 0.5, width: 10, height: 20 });
    expect(createPlacer().place({ anchor: 'intro', part: '#4' }, { x: 0.5, y: 0.5, dx: 0, dy: 0 })).toEqual({ x: 145, y: 10 });
    Reflect.deleteProperty(document, 'caretPositionFromPoint');
    Reflect.deleteProperty(Range.prototype, 'getClientRects');
  });

  it('places a cursor on the copy of an element that is shown, not a hidden one', () => {
    card(false, 0);
    card(true, 500);

    expect(createPlacer().place({ anchor: 'project:ankhora', part: '' }, { x: 0.5, y: 0.5, dx: 0, dy: 0 })).toEqual({
      x: 550,
      y: 25,
    });
    expect(createPlacer().place({ anchor: 'project:ankhora', part: '0.1' }, { x: 0.5, y: 0.5, dx: 0, dy: 0 })).toEqual({
      x: 550,
      y: 40,
    });
  });

  it('falls back to the anchor for a part this page lacks, and places nothing without the anchor', () => {
    card(true, 500);

    expect(createPlacer().place({ anchor: 'project:ankhora', part: '4.2' }, { x: 0, y: 0, dx: 0, dy: 0 })).toEqual({
      x: 500,
      y: 0,
    });
    expect(createPlacer().place({ anchor: 'project:elsewhere', part: '' }, { x: 0.5, y: 0.5, dx: 0, dy: 0 })).toBeUndefined();
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

    expect(spansOf(range)).toEqual([{ anchor: 'intro', start: 2, end: 9 }]);
  });

  it('cut a selection across anchors into a span per anchor, skipping what lies between', () => {
    const role = document.createElement('p');
    role.dataset.presence = 'role';
    role.textContent = 'Engineer';
    vi.spyOn(role, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    document.body.append(role);
    const between = document.createElement('p');
    between.textContent = 'free text';
    document.body.append(between);
    const element = intro();
    const range = document.createRange();
    range.setStart(role.firstChild!, 3);
    range.setEnd(element.firstChild!, 4);

    expect(spansOf(range)).toEqual([
      { anchor: 'role', start: 3, end: 8 },
      { anchor: 'intro', start: 0, end: 4 },
    ]);
  });

  it('turn those characters back into the same text on another copy of the page', () => {
    intro(false);
    const shown = intro();

    const range = rangeOf({ anchor: 'intro', start: 2, end: 9 });

    expect(range?.toString()).toBe('am Lény');
    expect(shown.contains(range!.startContainer)).toBe(true);
  });

  it('start a range in the text it covers, not at the end of the text before', () => {
    const element = intro();

    const range = rangeOf({ anchor: 'intro', start: 5, end: 9 });

    expect(range?.startContainer).toBe(element.querySelector('em')!.firstChild);
    expect(range?.toString()).toBe('Lény');
  });

  it('share nothing outside an anchor, and place nothing past its text', () => {
    const loose = document.createElement('div');
    loose.textContent = 'free text';
    document.body.append(loose);
    const range = document.createRange();
    range.selectNodeContents(loose);

    expect(spansOf(range)).toEqual([]);
    intro();
    expect(rangeOf({ anchor: 'intro', start: 2, end: 500 })).toBeUndefined();
  });
});
