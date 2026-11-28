import type { UIMessageChunk } from 'ai';
import { describe, expect, it } from 'vitest';

import { finalTextOnly } from './final-text';

const text = (id: string, delta: string): UIMessageChunk[] => [
  { type: 'text-start', id },
  { type: 'text-delta', id, delta },
  { type: 'text-end', id },
];

async function through(chunks: UIMessageChunk[]) {
  const out: UIMessageChunk[] = [];
  const stream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  }).pipeThrough(finalTextOnly());
  const reader = stream.getReader();
  for (let next = await reader.read(); !next.done; next = await reader.read()) out.push(next.value);
  return out;
}

const deltas = (chunks: UIMessageChunk[]) =>
  chunks.flatMap((chunk) => (chunk.type === 'text-delta' ? [chunk.delta] : []));

describe('finalTextOnly', () => {
  it('drops what a step writes before calling a tool, and the tool calls themselves', async () => {
    const out = await through([
      { type: 'start-step' },
      ...text('1', 'Let me read the project first.'),
      { type: 'tool-input-start', toolCallId: 'c', toolName: 'read' },
      { type: 'tool-output-available', toolCallId: 'c', output: '<document>secret body</document>' },
      { type: 'finish-step' },
      { type: 'start-step' },
      ...text('2', 'GitGlow turns a project into a cover.'),
      { type: 'finish-step' },
      { type: 'finish' },
    ]);

    expect(deltas(out)).toEqual(['GitGlow turns a project into a cover.']);
    expect(out.some((chunk) => chunk.type.startsWith('tool-'))).toBe(false);
    expect(out.map((chunk) => chunk.type)).toEqual([
      'start-step',
      'finish-step',
      'start-step',
      'text-start',
      'text-delta',
      'text-end',
      'finish-step',
      'finish',
    ]);
  });

  it('keeps the answer once when the model writes it, offers, then writes it again', async () => {
    const out = await through([
      { type: 'start-step' },
      ...text('1', 'A call is the quickest way.'),
      { type: 'tool-input-available', toolCallId: 'o', toolName: 'offer', input: { action: 'book' } },
      { type: 'data-action', data: 'book' },
      { type: 'finish-step' },
      { type: 'start-step' },
      ...text('2', 'A call is the quickest way.'),
      { type: 'finish-step' },
    ]);

    expect(deltas(out)).toEqual(['A call is the quickest way.']);
    expect(out).toContainEqual({ type: 'data-action', data: 'book' });
  });

  it('keeps the answer written beside an offer when the last step writes nothing', async () => {
    const out = await through([
      { type: 'start-step' },
      ...text('1', 'Yes, I am available.'),
      { type: 'tool-input-available', toolCallId: 'o', toolName: 'offer', input: { action: 'book' } },
      { type: 'finish-step' },
      { type: 'start-step' },
      { type: 'finish-step' },
      { type: 'finish' },
    ]);
    expect(deltas(out)).toEqual(['Yes, I am available.']);
    expect(out.at(-1)).toEqual({ type: 'finish' });
  });

  it('keeps the answer when the loop stops on the step that offers', async () => {
    const out = await through([
      { type: 'start-step' },
      ...text('1', 'Yes, I am available.'),
      { type: 'tool-input-available', toolCallId: 'o', toolName: 'offer', input: { action: 'book' } },
      { type: 'finish-step' },
      { type: 'finish' },
    ]);
    expect(deltas(out)).toEqual(['Yes, I am available.']);
  });

  it('lets a step without tools through whole', async () => {
    const out = await through([{ type: 'start-step' }, ...text('1', 'Hello.'), { type: 'finish-step' }]);
    expect(deltas(out)).toEqual(['Hello.']);
  });
});
