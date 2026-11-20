import { describe, expect, it } from 'vitest';

import { browserName } from './browser';

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

describe('browserName', () => {
  it.each([
    [CHROME, 'Chromium'],
    [`${CHROME} Edg/131.0.0.0`, 'Edge'],
    [`${CHROME} OPR/115.0.0.0`, 'Opera'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:133.0) Gecko/20100101 Firefox/133.0', 'Firefox'],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
      'Safari',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
      'Chromium',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15',
      'Firefox',
    ],
    ['curl/8.7.1', 'Unknown'],
  ])('names %s', (userAgent, name) => {
    expect(browserName(userAgent)).toBe(name);
  });
});
