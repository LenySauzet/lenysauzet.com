import type { GatewayProviderOptions } from '@ai-sdk/gateway';

export const ASK_MODEL = 'anthropic/claude-haiku-5.5';
export const FALLBACK_MODELS = ['openai/gpt-5-mini', 'google/gemini-2.5-flash'];

export const REASONING = 'none';
export const MAX_OUTPUT_TOKENS = 600;
export const MAX_STEPS = 2;

export const modelOf = (override?: string) => override ?? ASK_MODEL;

export const providerOptions = {
  gateway: { models: FALLBACK_MODELS, tags: ['ask'] } satisfies GatewayProviderOptions,
};
