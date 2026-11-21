import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Vector } from '@/lib/presence/motion';

import { createHighFive } from './high-five';

function pointer(type: 'pointermove' | 'pointerdown', init: MouseEventInit & { at?: number; kind?: string }) {
  const event = new MouseEvent(type, init);
  Object.defineProperty(event, 'pointerType', { value: init.kind ?? 'mouse' });
  Object.defineProperty(event, 'timeStamp', { value: init.at ?? 0 });
  window.dispatchEvent(event);
}

const move = (x: number, init: MouseEventInit & { kind?: string } = {}) =>
  pointer('pointermove', { clientX: x, clientY: 0, ...init });
const press = (at: number) => pointer('pointerdown', { button: 0, at });

describe('the high five', () => {
  let under: Element | null;
  let hands: Set<string>[];
  let claps: Vector[];
  let highFive: ReturnType<typeof createHighFive>;
  const html = document.documentElement;

  beforeEach(() => {
    under = document.body;
    document.elementFromPoint = () => under;
    hands = [];
    claps = [];
    highFive = createHighFive({ onHands: (ids) => hands.push(ids), onClap: (point) => claps.push(point) });
    highFive.drawn(new Map([['a', { x: 100, y: 0 }]]));
  });

  afterEach(() => {
    highFive.stop();
    window.scrollX = 0;
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  it('turns both cursors into hands once close, the own one through the page cursor', () => {
    move(300);
    expect(hands).toEqual([]);

    move(80);
    expect(hands.at(-1)).toEqual(new Set(['a']));
    expect(html.style.cursor).toContain('data:image/svg+xml');

    move(300);
    expect(hands.at(-1)).toEqual(new Set());
    expect(html.style.cursor).toBe('');
  });

  it('places the own pointer on the page, scrolled', () => {
    window.scrollX = 200;
    move(-110);

    expect(hands.at(-1)).toEqual(new Set(['a']));
  });

  it('keeps plain cursors over what can be clicked, and off the screen', () => {
    under = document.createElement('button');
    move(80);
    expect(hands).toEqual([]);

    under = null;
    move(90);
    expect(hands).toEqual([]);
  });

  it('follows only a mouse with no button held', () => {
    move(80, { kind: 'touch' });
    move(80, { buttons: 1 });
    expect(hands).toEqual([]);
  });

  it('claps when two close hands press together, whichever first, and not apart', () => {
    move(80);

    highFive.press('a', { x: 100, y: 0 }, 1000);
    press(1120);
    expect(claps).toEqual([{ x: 90, y: 0 }]);

    press(3000);
    highFive.press('a', { x: 100, y: 0 }, 3100);
    expect(claps).toHaveLength(2);

    highFive.press('a', { x: 100, y: 0 }, 5000);
    press(5500);
    expect(claps).toHaveLength(2);
  });

  it('sees a high five between two others too', () => {
    highFive.drawn(
      new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 30, y: 0 }],
      ])
    );
    highFive.press('a', { x: 0, y: 0 }, 0);
    highFive.press('b', { x: 30, y: 0 }, 100);

    expect(hands.at(-1)).toEqual(new Set(['a', 'b']));
    expect(claps).toEqual([{ x: 15, y: 0 }]);
  });

  it('puts the own hand away when the mouse leaves, under a modal and when stopped', () => {
    move(80);
    html.dispatchEvent(new MouseEvent('mouseleave'));
    expect(html.style.cursor).toBe('');

    move(80);
    highFive.cover(true);
    expect(html.style.cursor).toBe('');

    highFive.cover(false);
    expect(html.style.cursor).not.toBe('');
    highFive.stop();
    expect(html.style.cursor).toBe('');
  });

  it('forgets visitors who left', () => {
    move(80);
    highFive.keepOnly(new Set());

    expect(hands.at(-1)).toEqual(new Set());
  });
});
