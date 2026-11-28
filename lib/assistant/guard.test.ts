import { describe, expect, it, vi } from 'vitest';

import { botCheckOf, failureOf, refuse, type Guards } from './guard';

const request = (origin: string | null = 'https://lenysauzet.com', forwarded = '203.0.113.7, 10.0.0.1') =>
  new Request('https://lenysauzet.com/api/ask', {
    method: 'POST',
    headers: { ...(origin && { origin }), 'x-forwarded-for': forwarded },
  });

const guards = (overrides: Partial<Guards> = {}): Guards => ({
  env: { VERCEL_ENV: 'production', ASK_ENABLED: 'true' },
  isBot: async () => false,
  limiter: async () => true,
  ...overrides,
});

describe('failureOf', () => {
  it('lets a person through when everything holds', async () => {
    expect(await failureOf(request(), guards())).toBeUndefined();
  });

  it('is disabled until switched on in production, and whenever switched off', async () => {
    expect(await failureOf(request(), guards({ env: { VERCEL_ENV: 'production' } }))).toBe('disabled');
    expect(await failureOf(request(), guards({ env: { VERCEL_ENV: 'preview', ASK_ENABLED: 'false' } }))).toBe(
      'disabled'
    );
  });

  it('refuses another origin and a bot before spending anything', async () => {
    const limiter = vi.fn(async () => true);
    expect(await failureOf(request('https://evil.test'), guards({ limiter }))).toBe('invalid');
    expect(await failureOf(request(null), guards({ limiter }))).toBe('invalid');
    expect(await failureOf(request(), guards({ isBot: async () => true, limiter }))).toBe('invalid');
    expect(limiter).not.toHaveBeenCalled();
  });

  it('limits each visitor by their first forwarded address', async () => {
    const limiter = vi.fn(async (visitor: string) => visitor !== '203.0.113.7');
    expect(await failureOf(request(), guards({ limiter }))).toBe('rate-limited');
    expect(limiter).toHaveBeenCalledWith('203.0.113.7');
  });

  it('never answers in production without a limiter, but does in a preview', async () => {
    expect(await failureOf(request(), guards({ limiter: undefined }))).toBe('unavailable');
    expect(await failureOf(request(), guards({ limiter: undefined, env: { VERCEL_ENV: 'preview' } }))).toBeUndefined();
  });
});

describe('refuse', () => {
  it('answers each failure with its code and status, never cached', async () => {
    const response = refuse('rate-limited');
    expect(response.status).toBe(429);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ code: 'rate-limited' });
    expect(refuse('disabled').status).toBe(503);
    expect(refuse('invalid').status).toBe(400);
  });
});

describe('botCheckOf', () => {
  it('asks BotID on Vercel, and counts a check that cannot run as a bot', async () => {
    expect(await botCheckOf({ VERCEL: '1' }, async () => ({ isBot: false }))()).toBe(false);
    expect(await botCheckOf({ VERCEL: '1' }, async () => ({ isBot: true }))()).toBe(true);
    expect(await botCheckOf({ VERCEL: '1' }, () => Promise.reject(new Error('no OIDC header')))()).toBe(true);
  });

  it('lets a local build through, where BotID cannot run', async () => {
    const check = vi.fn(async () => ({ isBot: true }));
    expect(await botCheckOf({}, check)()).toBe(false);
    expect(check).not.toHaveBeenCalled();
  });
});
