import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';

import type { Message } from '@/lib/ask/conversation';

export function offerTool(writer: UIMessageStreamWriter<Message>) {
  let offered = false;
  return tool({
    description:
      'Show one button under your answer: "book" opens Lény’s booking page for a call, "resume" downloads his resume. At most once per answer.',
    inputSchema: z.object({ action: z.enum(['book', 'resume']) }),
    execute: async ({ action }) => {
      if (offered) return 'A button is already shown under this answer.';
      offered = true;
      writer.write({ type: 'data-action', data: action });
      return `The ${action === 'book' ? 'booking' : 'resume'} button will show under your answer.`;
    },
  });
}
