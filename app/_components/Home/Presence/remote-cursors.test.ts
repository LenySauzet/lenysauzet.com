import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRemoteCursors } from './remote-cursors';

const point = { anchor: 'page', x: 0.5, y: 0.5 };

const ink = () => {
  const element = document.createElement('div');
  element.innerHTML = '<svg><filter><feGaussianBlur stdDeviation="0 0"></feGaussianBlur></filter></svg>';
  return element;
};

const scaleOf = (element: HTMLElement) => Number(/scale\(([\d.]+)\)/.exec(element.style.transform)?.[1]);

describe('the remote cursors', () => {
  let published: string[][];
  let cursors: ReturnType<typeof createRemoteCursors>;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date', 'setTimeout', 'clearTimeout'],
    });
    published = [];
    cursors = createRemoteCursors((ids) => published.push(ids), () => false);
  });

  afterEach(() => cursors.stop());

  const shown = () => published.at(-1) ?? [];

  it('shows ten at most, and keeps them while more keep moving', () => {
    for (let index = 0; index < 12; index += 1) cursors.move(`v${index}`, point);
    const updates = published.length;

    for (let round = 0; round < 5; round += 1) for (let index = 0; index < 12; index += 1) cursors.move(`v${index}`, point);

    expect(shown()).toHaveLength(10);
    expect(shown()).not.toContain('v10');
    expect(published).toHaveLength(updates);
  });

  it('gives a freed place to one who was waiting', () => {
    for (let index = 0; index < 11; index += 1) cursors.move(`v${index}`, point);

    cursors.remove('v0');

    expect(shown()).toContain('v10');
    expect(shown()).not.toContain('v0');
  });

  it('keeps only the visitors a snapshot names', () => {
    cursors.move('v0', point);
    cursors.move('v1', point);

    cursors.keepOnly(new Set(['v1']));

    expect(shown()).toEqual(['v1']);
  });

  it('dips while pressed and comes back once released', () => {
    const element = ink();
    cursors.move('v0', point);
    cursors.attach('v0', element);
    vi.advanceTimersByTime(300);
    expect(scaleOf(element)).toBeCloseTo(1);

    cursors.press('v0');
    vi.advanceTimersByTime(400);
    expect(scaleOf(element)).toBeCloseTo(0.82, 2);

    cursors.release('v0');
    vi.advanceTimersByTime(400);
    expect(scaleOf(element)).toBeCloseTo(1, 2);
  });

  it('fades to a trace once still, without leaving', () => {
    const element = ink();
    cursors.move('v0', point);
    cursors.attach('v0', element);
    vi.advanceTimersByTime(500);
    expect(element.style.opacity).toBe('1');

    vi.advanceTimersByTime(3000);

    expect(element.style.opacity).toBe('0.2');
    expect(shown()).toEqual(['v0']);
  });
});
