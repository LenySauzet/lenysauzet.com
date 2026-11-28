import { describe, expect, it } from 'vitest';

import { edgesOf } from './edges';

describe('edgesOf', () => {
  it('hides nothing when the row fits, the far end at the start, both in the middle, the near end at the end', () => {
    expect(edgesOf({ scrollLeft: 0, scrollWidth: 300, clientWidth: 300 })).toEqual({ start: false, end: false });
    expect(edgesOf({ scrollLeft: 0, scrollWidth: 500, clientWidth: 300 })).toEqual({ start: false, end: true });
    expect(edgesOf({ scrollLeft: 100, scrollWidth: 500, clientWidth: 300 })).toEqual({ start: true, end: true });
    expect(edgesOf({ scrollLeft: 200, scrollWidth: 500, clientWidth: 300 })).toEqual({ start: true, end: false });
  });
});
