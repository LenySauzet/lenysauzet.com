import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { askEnabled } from '@/lib/ask/enabled';
import type { Failure } from '@/lib/ask/conversation';

import { redisOf, type AskEnv } from './env';

const STATUS: Record<Failure, number> = { disabled: 503, 'rate-limited': 429, unavailable: 503, invalid: 400 };

export const refuse = (failure: Failure) =>
  Response.json({ code: failure }, { status: STATUS[failure], headers: { 'Cache-Control': 'no-store' } });

export type Limiter = (visitor: string) => Promise<boolean>;

export function limiterOf(env: AskEnv): Limiter | undefined {
  const credentials = redisOf(env);
  if (!credentials) return undefined;
  const redis = new Redis(credentials);
  const windows = [
    new Ratelimit({ redis, prefix: 'ask:minute', limiter: Ratelimit.slidingWindow(10, '1 m') }),
    new Ratelimit({ redis, prefix: 'ask:day', limiter: Ratelimit.slidingWindow(60, '1 d') }),
  ];
  return async (visitor) => {
    const results = await Promise.all(windows.map((window) => window.limit(visitor)));
    return results.every((result) => result.success);
  };
}

export const botCheckOf = (env: AskEnv, check: () => Promise<{ isBot: boolean }>) => async (): Promise<boolean> => {
  if (!env.VERCEL) return false;
  return check().then(
    ({ isBot }) => isBot,
    () => true
  );
};

export const visitorOf = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

export interface Guards {
  env: AskEnv;
  isBot: () => Promise<boolean>;
  limiter: Limiter | undefined;
}

export const sameOrigin = (request: Request) => {
  const origin = request.headers.get('origin');
  return origin !== null && origin === new URL(request.url).origin;
};

export async function failureOf(request: Request, { env, isBot, limiter }: Guards): Promise<Failure | undefined> {
  if (!askEnabled(env)) return 'disabled';
  if (!sameOrigin(request) || (await isBot())) return 'invalid';
  if (!limiter) return env.VERCEL_ENV === 'production' ? 'unavailable' : undefined;
  return (await limiter(visitorOf(request))) ? undefined : 'rate-limited';
}
