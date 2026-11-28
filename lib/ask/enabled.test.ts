import { describe, expect, it } from 'vitest';

import { askEnabled } from './enabled';

describe('askEnabled', () => {
  it('shows the bar everywhere but production until it is switched on', () => {
    expect(askEnabled({})).toBe(true);
    expect(askEnabled({ VERCEL_ENV: 'preview' })).toBe(true);
    expect(askEnabled({ VERCEL_ENV: 'production' })).toBe(false);
  });

  it('obeys ASK_ENABLED in either direction', () => {
    expect(askEnabled({ VERCEL_ENV: 'production', ASK_ENABLED: 'true' })).toBe(true);
    expect(askEnabled({ VERCEL_ENV: 'preview', ASK_ENABLED: 'false' })).toBe(false);
  });
});
