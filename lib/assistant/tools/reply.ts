import { tool } from 'ai';
import { z } from 'zod';

export const replyTool = () =>
  tool({
    description:
      'Call this when no document needs reading before you answer: a greeting, a question the core already answers in full, or a request you must decline.',
    inputSchema: z.object({}),
    execute: async () => 'Write your answer now.',
  });
