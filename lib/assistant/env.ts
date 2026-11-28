import { z } from 'zod';

const flag = z.enum(['true', 'false']).optional();

const schema = z.object({
  ASK_ENABLED: flag,
  VERCEL: z.literal('1').optional(),
  ASK_MODEL: z
    .string()
    .regex(/^[a-z0-9-]+\/[\w.:-]+$/)
    .optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  KV_REST_API_URL: z.url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),
});

export type AskEnv = z.infer<typeof schema>;

export const readEnv = (source: Record<string, string | undefined> = process.env): AskEnv => schema.parse(source);

export const redisOf = (env: AskEnv) => {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : undefined;
};
