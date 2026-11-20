import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRemoteCursors } from './remote-cursors';

const point = { anchor: 'page', x: 0.5, y: 0.5 };

describe('the remote cursors', () => {
  let published: string[][];
  let cursors: ReturnType<typeof createRemoteCursors>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] });
    published = [];
    cursors = createRemoteCursors((ids) => published.push(ids), () => false);
  });

  afterEach(() => cursors.stop());

  const moveFrom = (id: string) => cursors.receive({ type: 'move', id, point });
  const shown = () => published.at(-1) ?? [];

  it('shows ten at most, and keeps them while more keep moving', () => {
    for (let index = 0; index < 12; index += 1) moveFrom(`v${index}`);
    const updates = published.length;

    for (let round = 0; round < 5; round += 1) for (let index = 0; index < 12; index += 1) moveFrom(`v${index}`);

    expect(shown()).toHaveLength(10);
    expect(shown()).not.toContain('v10');
    expect(published).toHaveLength(updates);
  });

  it('gives a freed place to one who was waiting', () => {
    for (let index = 0; index < 11; index += 1) moveFrom(`v${index}`);

    cursors.receive({ type: 'leave', id: 'v0' });

    expect(shown()).toContain('v10');
    expect(shown()).not.toContain('v0');
  });

  it('lets a cursor go once it has been still for a while', () => {
    moveFrom('v0');
    expect(shown()).toEqual(['v0']);

    vi.advanceTimersByTime(6100);

    expect(shown()).toEqual([]);
  });

  it('starts from a snapshot of everyone already there', () => {
    cursors.receive({ type: 'snapshot', cursors: [{ id: 'v0', point }, { id: 'v1', point }] });

    expect(shown()).toEqual(['v0', 'v1']);
  });
});
