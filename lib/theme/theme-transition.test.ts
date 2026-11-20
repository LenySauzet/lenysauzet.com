import { afterEach, describe, expect, it, vi } from 'vitest';

import { prefersReducedMotion } from '@/test/media';

import { withThemeTransition } from './theme-transition';

const startViewTransition = vi.fn((update: () => void) => update());

describe('withThemeTransition', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
  });

  it('sweeps the change in through a view transition', () => {
    prefersReducedMotion(false);
    Object.assign(document, { startViewTransition });
    const change = vi.fn();

    withThemeTransition(change);

    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(change).toHaveBeenCalledOnce();
  });

  it('changes at once under reduced motion', () => {
    Object.assign(document, { startViewTransition });
    const change = vi.fn();

    withThemeTransition(change);

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(change).toHaveBeenCalledOnce();
  });

  it('changes at once where the browser has no view transitions', () => {
    prefersReducedMotion(false);
    const change = vi.fn();

    withThemeTransition(change);

    expect(change).toHaveBeenCalledOnce();
  });
});
