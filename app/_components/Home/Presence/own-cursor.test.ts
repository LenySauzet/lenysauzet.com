import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClientMessage } from '@/lib/presence/protocol';

import { shareOwnCursor } from './own-cursor';

function pointer(type: string, x: number, y = 0, target: EventTarget = window) {
  const event = new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  Object.defineProperty(event, 'timeStamp', { value: performance.now() });
  target.dispatchEvent(event);
}

describe('the own cursor', () => {
  let sent: ClientMessage[];
  let sentAt: number[];
  let ripples: number;
  let sharing: ReturnType<typeof shareOwnCursor>;
  const types = () => sent.map(({ type }) => type);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['performance', 'Date', 'setTimeout', 'clearTimeout'] });
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1000);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: () => {},
    } as unknown as MediaQueryList);
    document.elementFromPoint = () => null;
    sent = [];
    sentAt = [];
    ripples = 0;
    const send = (message: ClientMessage) => {
      sent.push(message);
      sentAt.push(performance.now());
    };
    sharing = shareOwnCursor({ send, wake: () => {}, sleep: () => {} }, () => {
      ripples += 1;
    });
  });

  afterEach(() => {
    sharing.stop();
    vi.restoreAllMocks();
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  it('sends its moves in batches, at most every 33 ms, four samples at most', () => {
    for (let x = 0; x < 12; x += 1) {
      pointer('pointermove', x * 10);
      vi.advanceTimersByTime(8);
    }
    vi.advanceTimersByTime(40);

    const gaps = sentAt.slice(1).map((time, index) => time - (sentAt[index] ?? 0));
    expect(gaps.every((gap) => gap >= 33)).toBe(true);
    for (const move of sent) if (move.type === 'move') expect(move.path.samples.length).toBeLessThanOrEqual(4);
    expect(sent.some((move) => move.type === 'move' && move.path.samples.length === 4)).toBe(true);
  });

  it('sends where it is before a press, and a click once released in place', () => {
    pointer('pointermove', 100);
    vi.advanceTimersByTime(10);
    pointer('pointermove', 120);
    pointer('pointerdown', 120);
    pointer('pointerup', 121);

    expect(types().slice(-4)).toEqual(['move', 'press', 'release', 'click']);
    expect(ripples).toBe(1);
  });

  it('goes quiet while the page scrolls, and comes back where it settled', () => {
    pointer('pointermove', 100);
    vi.advanceTimersByTime(40);
    sent = [];

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    pointer('pointermove', 110);
    expect(types()).toEqual(['leave']);

    vi.advanceTimersByTime(200);
    expect(types()).toEqual(['leave', 'move']);
  });

  it('leaves and stays silent while a modal covers the page, and ripples none of its clicks', () => {
    pointer('pointermove', 100);
    vi.advanceTimersByTime(40);
    sent = [];

    sharing.cover(true);
    pointer('pointermove', 200);
    pointer('pointerdown', 200);
    pointer('pointerup', 200);
    vi.advanceTimersByTime(100);

    expect(types()).toEqual(['leave']);
    expect(ripples).toBe(0);
  });

  it('shares nothing of a press on what moves with its content, as the island', () => {
    const island = document.createElement('div');
    island.dataset.presenceIgnore = '';
    document.body.append(island);

    pointer('pointerdown', 10, 10, island);
    pointer('pointerup', 10, 10, island);

    expect(types()).not.toContain('press');
    expect(types()).not.toContain('click');
    expect(ripples).toBe(0);
    island.remove();
  });
});
