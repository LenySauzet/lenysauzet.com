import { describe, expect, it } from 'vitest';

import { retryDelay } from './connection';

describe('retryDelay', () => {
  it('backs off exponentially, jittered, up to a ceiling', () => {
    expect(retryDelay(0, () => 1)).toBe(1000);
    expect(retryDelay(3, () => 1)).toBe(8000);
    expect(retryDelay(3, () => 0)).toBe(4000);
    expect(retryDelay(20, () => 1)).toBe(30_000);
  });
});
