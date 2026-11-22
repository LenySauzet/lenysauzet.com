import { beforeEach, describe, expect, it, vi } from 'vitest';

import { announce, useIslandStore } from './use-island-store';

const ids = () => useIslandStore.getState().presented.map((presence) => presence.id);

describe('the island store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useIslandStore.setState({ presented: [] });
  });

  it('lets a presence go once its time is up', () => {
    useIslandStore.getState().present({ id: 'hint' }, { ttl: 1000 });

    vi.advanceTimersByTime(999);
    expect(ids()).toEqual(['hint']);
    vi.advanceTimersByTime(1);
    expect(ids()).toEqual([]);
  });

  it('restarts the clock and moves to the front when presented again', () => {
    useIslandStore.getState().present({ id: 'hint' }, { ttl: 1000 });
    announce('Link copied');
    vi.advanceTimersByTime(800);
    useIslandStore.getState().present({ id: 'hint' }, { ttl: 1000 });

    vi.advanceTimersByTime(800);
    expect(ids()).toEqual(['announcement', 'hint']);
    vi.advanceTimersByTime(1000);
    expect(ids()).toEqual([]);
  });

  it('leaves the state untouched when dismissing what is not there', () => {
    const before = useIslandStore.getState().presented;

    useIslandStore.getState().dismiss('hint');

    expect(useIslandStore.getState().presented).toBe(before);
  });

  it('keeps an announcement up as long as asked', () => {
    announce('Version française disponible', undefined, { ttl: 5000 });

    vi.advanceTimersByTime(4999);
    expect(ids()).toEqual(['announcement']);
    vi.advanceTimersByTime(1);
    expect(ids()).toEqual([]);
  });
});
