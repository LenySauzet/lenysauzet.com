import { afterEach, describe, expect, it, vi } from 'vitest';

import { layoutNow } from './layout';

const viewport = (width: number) =>
  vi
    .spyOn(window, 'matchMedia')
    .mockImplementation(
      (query) => ({ matches: width >= Number(/([\d.]+)rem/.exec(query)?.[1]) * 16 }) as MediaQueryList
    );

describe('layoutNow', () => {
  afterEach(() => vi.restoreAllMocks());

  it('counts the columns the projects are laid out in at this width', () => {
    viewport(700);
    expect(layoutNow()).toBe(1);
    viewport(800);
    expect(layoutNow()).toBe(2);
    viewport(1024);
    expect(layoutNow()).toBe(3);
  });
});
