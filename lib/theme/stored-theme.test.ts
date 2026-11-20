import { describe, expect, it } from 'vitest';

import { themeOf } from './stored-theme';

describe('themeOf', () => {
  it('honours a stored choice, follows the system only when told to, and is dark otherwise', () => {
    expect(themeOf('light', false)).toBe('light');
    expect(themeOf('dark', true)).toBe('dark');
    expect(themeOf('system', true)).toBe('light');
    expect(themeOf('system', false)).toBe('dark');
    expect(themeOf(null, true)).toBe('dark');
  });
});
