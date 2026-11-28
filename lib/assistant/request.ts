import { z } from 'zod';

export const MAX_MESSAGES = 20;
export const MAX_QUESTION = 500;
const MAX_ANSWER = 4000;

const textPart = (max: number) => z.object({ type: z.literal('text'), text: z.string().trim().min(1).max(max) });

const userMessage = z.object({
  id: z.string().max(100),
  role: z.literal('user'),
  parts: z.array(textPart(MAX_QUESTION)).length(1),
});

const assistantMessage = z.object({
  id: z.string().max(100),
  role: z.literal('assistant'),
  parts: z.array(z.looseObject({ type: z.string() })).max(40),
});

export const askRequestSchema = z.object({
  messages: z
    .array(z.discriminatedUnion('role', [userMessage, assistantMessage]))
    .min(1)
    .max(MAX_MESSAGES)
    .refine((messages) => messages.at(-1)?.role === 'user', 'the last message is a question'),
  surface: z.enum(['portfolio']),
  locale: z.enum(['en', 'fr']),
});

export type AskRequest = z.infer<typeof askRequestSchema>;

export type Exchange = { role: 'user' | 'assistant'; parts: { type: 'text'; text: string }[] };

export const exchangesOf = (request: AskRequest): Exchange[] =>
  request.messages.flatMap((message) => {
    const text = message.parts
      .flatMap((part) => (part.type === 'text' && typeof part.text === 'string' ? [part.text] : []))
      .join('')
      .slice(0, MAX_ANSWER);
    return text ? [{ role: message.role, parts: [{ type: 'text' as const, text }] }] : [];
  });

export const parseAskRequest = (body: unknown) => askRequestSchema.safeParse(body);
