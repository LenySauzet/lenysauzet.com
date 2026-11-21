import { describe, expect, it } from 'vitest';

import { networkOf } from '../src/address';

describe('networkOf', () => {
  it('keeps an IPv4 address whole', () => {
    expect(networkOf('203.0.113.7')).toBe('203.0.113.7');
  });

  it('reduces an IPv6 address to its /64, however it is written', () => {
    expect(networkOf('2001:db8:85a3:42:1:2:3:4')).toBe('2001:db8:85a3:42');
    expect(networkOf('2001:DB8:85a3:0042::9')).toBe('2001:db8:85a3:42');
    expect(networkOf('2001:db8::1')).toBe('2001:db8:0:0');
    expect(networkOf('::1')).toBe('0:0:0:0');
  });
});
