import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Path } from '@/lib/presence/protocol';

import { createRemoteCursors, GHOSTS } from './remote-cursors';

const at = (x: number, dx = 0): Path => ({ anchor: 'page', layout: 3, samples: [{ age: 0, x, y: 0, dx, dy: 0 }] });

const ink = () => {
  const element = document.createElement('div');
  element.innerHTML = `<svg><filter><feGaussianBlur stdDeviation="0 0"></feGaussianBlur></filter></svg>${'<div data-cursor-ghost></div>'.repeat(GHOSTS)}<div data-cursor-main></div>`;
  return element;
};

const mainOf = (element: HTMLElement) => element.querySelector<HTMLElement>('[data-cursor-main]')!;
const scaleOf = (element: HTMLElement) => Number(/scale\(([\d.]+)\)/.exec(mainOf(element).style.transform)?.[1]);
const opacityOf = (element: HTMLElement) => Number(mainOf(element).style.opacity);

describe('the remote cursors', () => {
  let published: string[][];
  let clicked: number[];
  let cursors: ReturnType<typeof createRemoteCursors>;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date', 'setTimeout', 'clearTimeout'],
    });
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1000);
    published = [];
    clicked = [];
    cursors = createRemoteCursors({
      onChange: (ids) => published.push(ids),
      onClick: (_, point) => clicked.push(point.x),
      isStill: () => false,
    });
  });

  afterEach(() => {
    cursors.stop();
    vi.restoreAllMocks();
  });

  const shown = () => published.at(-1) ?? [];

  it('shows ten at most, and keeps them while more keep moving', () => {
    for (let index = 0; index < 12; index += 1) cursors.move(`v${index}`, at(0.5));
    const updates = published.length;

    for (let round = 0; round < 5; round += 1) for (let index = 0; index < 12; index += 1) cursors.move(`v${index}`, at(0.5));

    expect(shown()).toHaveLength(10);
    expect(shown()).not.toContain('v10');
    expect(published).toHaveLength(updates);
  });

  it('gives a freed place to one who was waiting', () => {
    for (let index = 0; index < 11; index += 1) cursors.move(`v${index}`, at(0.5));

    cursors.remove('v0');

    expect(shown()).toContain('v10');
    expect(shown()).not.toContain('v0');
  });

  it('keeps only the visitors a snapshot names', () => {
    cursors.move('v0', at(0.5));
    cursors.move('v1', at(0.5));

    cursors.keepOnly(new Set(['v1']));

    expect(shown()).toEqual(['v1']);
  });

  it('springs down when pressed, past its rest, and back once released', () => {
    const element = ink();
    cursors.move('v0', at(0.5));
    cursors.attach('v0', element);
    vi.advanceTimersByTime(300);
    expect(scaleOf(element)).toBeCloseTo(1);

    cursors.press('v0');
    let lowest = 1;
    for (let time = 0; time < 600; time += 16) {
      vi.advanceTimersByTime(16);
      lowest = Math.min(lowest, scaleOf(element));
    }
    expect(lowest).toBeLessThan(0.8);
    expect(scaleOf(element)).toBeCloseTo(0.8, 2);

    cursors.release('v0');
    vi.advanceTimersByTime(800);
    expect(scaleOf(element)).toBeCloseTo(1, 2);
  });

  it('fades to a trace after a second still, and comes back when it moves', () => {
    const element = ink();
    cursors.attach('v0', element);
    for (let time = 0; time < 300; time += 16) {
      cursors.move('v0', at(time / 1000));
      vi.advanceTimersByTime(16);
    }
    expect(opacityOf(element)).toBeGreaterThan(0.9);

    vi.advanceTimersByTime(700);
    expect(opacityOf(element)).toBe(1);

    vi.advanceTimersByTime(1300);
    expect(opacityOf(element)).toBeLessThan(0.25);
    expect(shown()).toEqual(['v0']);

    for (let time = 0; time < 200; time += 16) {
      cursors.move('v0', at(0.3 + time / 1000));
      vi.advanceTimersByTime(16);
    }
    expect(opacityOf(element)).toBeGreaterThan(0.9);
  });

  it('sleeps rather than spin on a cursor this page cannot place, and drops its clicks', () => {
    const element = ink();
    cursors.move('v0', { anchor: 'project:elsewhere', layout: 3, samples: [{ age: 0, x: 0, y: 0, dx: 0, dy: 0 }] });
    cursors.attach('v0', element);
    cursors.press('v0');
    cursors.release('v0');
    cursors.click('v0');

    vi.advanceTimersByTime(500);

    expect(vi.getTimerCount()).toBe(0);
    expect(clicked).toEqual([]);
  });

  it('ripples a click where it was pressed, once per click its owner sent', () => {
    cursors.move('v0', at(0.1));
    cursors.attach('v0', ink());
    vi.advanceTimersByTime(300);

    cursors.press('v0');
    vi.advanceTimersByTime(80);
    cursors.move('v0', at(0.12));
    cursors.release('v0');
    cursors.click('v0');
    vi.advanceTimersByTime(300);
    expect(clicked).toEqual([100]);

    cursors.press('v0');
    vi.advanceTimersByTime(80);
    cursors.release('v0');
    vi.advanceTimersByTime(300);
    expect(clicked).toEqual([100]);
  });

  it('follows the motion while fast, and settles on the precise element once slow', () => {
    const card = document.createElement('article');
    card.dataset.presence = 'card';
    card.innerHTML = '<a>View</a>';
    const link = card.querySelector('a')!;
    for (const [element, box] of [
      [card, { left: 0, top: 0, width: 1000, height: 100 }],
      [link, { left: 500, top: 50, width: 10, height: 10 }],
    ] as const) {
      vi.spyOn(element, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(box as DOMRect);
    }
    document.body.append(card);
    const element = ink();
    cursors.attach('v0', element);
    const xOf = () => Number(/translate3d\(([\d.]+)px/.exec(mainOf(element).style.transform)?.[1]);
    const sweep = (x: number) => ({
      anchor: 'card',
      layout: 3 as const,
      detail: { part: '0', x: 0.5, y: 0.5, width: 10, height: 10 },
      samples: [{ age: 16, x: x - 0.016, y: 0.1, dx: 0, dy: 0 }, { age: 0, x, y: 0.1, dx: 0, dy: 0 }],
    });

    let drift = 0;
    for (let time = 0; time < 400; time += 16) {
      cursors.move('v0', sweep(time / 1000));
      vi.advanceTimersByTime(16);
      if (time > 200) drift = Math.max(drift, Math.abs(xOf() - (time - 60)));
    }
    expect(drift).toBeLessThan(60);

    vi.advanceTimersByTime(1000);
    expect(xOf()).toBeCloseTo(505, 0);
    card.remove();
  });

  it('plays a click that opened a modal before the cursor leaves with it', () => {
    cursors.move('v0', at(0.2));
    cursors.attach('v0', ink());
    vi.advanceTimersByTime(300);

    cursors.press('v0');
    vi.advanceTimersByTime(80);
    cursors.release('v0');
    cursors.click('v0');
    cursors.leave('v0');
    expect(shown()).toEqual(['v0']);

    vi.advanceTimersByTime(300);
    expect(clicked).toEqual([200]);
    expect(shown()).toEqual([]);
  });

  it('ignores a detail that is not the same size here, as a part folded on this page', () => {
    const card = document.createElement('article');
    card.dataset.presence = 'card';
    card.innerHTML = '<a>You</a>';
    const folded = card.querySelector('a')!;
    for (const [element, box] of [
      [card, { left: 0, top: 0, width: 1000, height: 100 }],
      [folded, { left: 500, top: 50, width: 0, height: 32 }],
    ] as const) {
      vi.spyOn(element, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(box as DOMRect);
    }
    document.body.append(card);
    const element = ink();
    cursors.attach('v0', element);
    cursors.move('v0', {
      anchor: 'card',
      layout: 3,
      detail: { part: '0', x: 0.5, y: 0.5, width: 32, height: 32 },
      samples: [{ age: 0, x: 0.2, y: 0.1, dx: 0, dy: 0 }],
    });

    vi.advanceTimersByTime(1000);

    expect(mainOf(element).style.transform).toMatch(/^translate3d\(200px/);
    card.remove();
  });

  it('draws a trail behind a fast cursor only', () => {
    const element = ink();
    cursors.attach('v0', element);
    for (let time = 0; time < 200; time += 16) {
      cursors.move('v0', at(time / 300));
      vi.advanceTimersByTime(16);
    }
    const ghost = element.querySelector<HTMLElement>('[data-cursor-ghost]')!;
    expect(Number(ghost.style.opacity)).toBeGreaterThan(0.1);

    vi.advanceTimersByTime(1000);
    expect(Number(ghost.style.opacity)).toBe(0);
  });
});
