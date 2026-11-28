import type { UIMessageChunk } from 'ai';
import { describe, expect, it } from 'vitest';

import { answerOnly } from './answer-stream';

const text = (id: string, delta: string): UIMessageChunk[] => [
  { type: 'text-start', id },
  { type: 'text-delta', id, delta },
  { type: 'text-end', id },
];

async function through(chunks: UIMessageChunk[]) {
  const out: UIMessageChunk[] = [];
  const reader = new ReadableStream<UIMessageChunk>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  })
    .pipeThrough(answerOnly())
    .getReader();
  for (let next = await reader.read(); !next.done; next = await reader.read()) out.push(next.value);
  return out;
}

describe('answerOnly', () => {
  it('streams the answer step as it comes, never the choosing step’s words or its tool calls', async () => {
    const out = await through([
      { type: 'start-step' },
      ...text('0', 'Let me read that.'),
      { type: 'tool-input-start', toolCallId: 'c', toolName: 'read' },
      { type: 'tool-output-available', toolCallId: 'c', output: '<document>the whole story</document>' },
      { type: 'data-action', data: 'book' },
      { type: 'finish-step' },
      { type: 'start-step' },
      ...text('1', 'GitGlow turns a project into a cover.'),
      { type: 'finish-step' },
      { type: 'finish' },
    ]);

    expect(out.map((chunk) => chunk.type)).toEqual([
      'start-step',
      'data-action',
      'finish-step',
      'start-step',
      'text-start',
      'text-delta',
      'text-end',
      'finish-step',
      'finish',
    ]);
    expect(JSON.stringify(out)).not.toContain('the whole story');
  });
});
