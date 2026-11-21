import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Vector } from '@/lib/presence/motion';

import { createHighFive } from './high-five';

const WIDTH = 1000;

function pointer(type: 'pointermove' | 'pointerdown', init: MouseEventInit & { kind?: string }) {
  const event = new MouseEvent(type, init);
  Object.defineProperty(event, 'pointerType', { value: init.kind ?? 'mouse' });
  Object.defineProperty(event, 'timeStamp', { value: performance.now() });
  window.dispatchEvent(event);
}

const move = (x: number, init: MouseEventInit & { kind?: string } = {}) =>
  pointer('pointermove', { clientX: x, clientY: 0, ...init });
const press = (x = 80) => pointer('pointerdown', { button: 0, clientX: x, clientY: 0 });

describe('the high five', () => {
  let under: Element;
  let hands: Set<string>[];
  let claps: Vector[];
  let highFive: ReturnType<typeof createHighFive>;
  const html = document.documentElement;
  const remotePress = (id: string, x: number) => highFive.press(id, { x, y: 0 }, performance.now());

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['performance'] });
    vi.advanceTimersByTime(10_000);
    under = document.body;
    document.elementFromPoint = (x: number) => (x >= 0 && x < WIDTH ? under : null);
    hands = [];
    claps = [];
    highFive = createHighFive({ onHands: (ids) => hands.push(ids), onClap: (point) => claps.push(point) });
    highFive.drawn(new Map([['a', { x: 100, y: 0 }]]));
  });

  afterEach(() => {
    highFive.stop();
    window.scrollX = 0;
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  it('turns both cursors into hands once close, the own one through the page cursor', () => {
    move(300);
    expect(hands).toEqual([]);

    move(80);
    expect(hands.at(-1)).toEqual(new Set(['a']));
    expect(html.style.cursor).toBe('grab');

    move(300);
    expect(hands.at(-1)).toEqual(new Set());
    expect(html.style.cursor).toBe('');
  });

  it('places the own pointer on the page, scrolled', () => {
    highFive.drawn(new Map([['a', { x: 300, y: 0 }]]));
    window.scrollX = 200;
    move(90);

    expect(hands.at(-1)).toEqual(new Set(['a']));
  });

  it('keeps plain cursors over what can be clicked, and off the screen', () => {
    under = document.createElement('button');
    move(80);
    expect(hands).toEqual([]);

    under = document.body;
    highFive.drawn(new Map([['a', { x: -20, y: 0 }]]));
    move(0);
    expect(hands).toEqual([]);
  });

  it('follows only a mouse, and puts the hand away while a button is held', () => {
    move(80, { kind: 'touch' });
    expect(hands).toEqual([]);

    move(80);
    move(82, { buttons: 1 });
    expect(html.style.cursor).toBe('');
  });

  it('claps when two close hands press together, whichever first, and not apart', () => {
    move(80);

    remotePress('a', 100);
    vi.advanceTimersByTime(120);
    press();
    expect(claps).toEqual([{ x: 90, y: 0 }]);

    vi.advanceTimersByTime(2000);
    press();
    vi.advanceTimersByTime(100);
    remotePress('a', 100);
    expect(claps).toHaveLength(2);

    vi.advanceTimersByTime(2000);
    remotePress('a', 100);
    vi.advanceTimersByTime(400);
    press();
    expect(claps).toHaveLength(2);
  });

  it('claps for an own press though the mouse moved before the answer came', () => {
    move(80);
    press();
    move(81, { buttons: 1 });
    vi.advanceTimersByTime(150);
    remotePress('a', 100);

    expect(claps).toHaveLength(1);
  });

  it('ignores presses heard long before they play, as after a modal or a hidden tab', () => {
    highFive.drawn(
      new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 30, y: 0 }],
      ])
    );
    const heard = performance.now();
    vi.advanceTimersByTime(2000);
    highFive.press('a', { x: 0, y: 0 }, heard);
    highFive.press('b', { x: 30, y: 0 }, heard + 50);

    expect(claps).toEqual([]);
  });

  it('sees a high five between two others too', () => {
    highFive.drawn(
      new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 30, y: 0 }],
      ])
    );
    remotePress('a', 0);
    vi.advanceTimersByTime(100);
    remotePress('b', 30);

    expect(hands.at(-1)).toEqual(new Set(['a', 'b']));
    expect(claps).toEqual([{ x: 15, y: 0 }]);
  });

  it('puts the own hand away when the mouse leaves, the tab hides, under a modal and when stopped', () => {
    move(80);
    html.dispatchEvent(new MouseEvent('mouseleave'));
    expect(html.style.cursor).toBe('');

    move(80);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(html.style.cursor).toBe('');
    hidden.mockRestore();

    move(80);
    highFive.cover(true);
    expect(html.style.cursor).toBe('');

    highFive.cover(false);
    expect(html.style.cursor).toBe('grab');
    highFive.stop();
    expect(html.style.cursor).toBe('');
  });

  it('forgets visitors who left', () => {
    move(80);
    highFive.keepOnly(new Set());

    expect(hands.at(-1)).toEqual(new Set());
  });
});
