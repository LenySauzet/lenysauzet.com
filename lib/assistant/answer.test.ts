import { readUIMessageStream, simulateReadableStream, type UIMessageChunk } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, it, vi } from 'vitest';

import { sourcesOf, textOf, actionOf, type Message } from '@/lib/ask/conversation';
import { sampleCorpus } from '@/test/ask';

import { answer, STREAM_FAILURE } from './answer';
import { parseAskRequest } from './request';

const usage = {
  inputTokens: { total: 900, noCache: 900, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 40, text: 40, reasoning: undefined },
};

const finish = (unified: 'stop' | 'tool-calls') => ({
  type: 'finish' as const,
  finishReason: { unified, raw: undefined },
  logprobs: undefined,
  usage,
});

const toolCall = (toolCallId: string, toolName: string, input: object) => ({
  type: 'tool-call' as const,
  toolCallId,
  toolName,
  input: JSON.stringify(input),
});

const steps = [
  [toolCall('1', 'read', { ids: ['profile'] }), toolCall('2', 'offer', { action: 'book' }), finish('tool-calls')],
  [
    { type: 'text-start' as const, id: 't' },
    { type: 'text-delta' as const, id: 't', delta: 'Yes, I am available ' },
    { type: 'text-delta' as const, id: 't', delta: 'right away.' },
    { type: 'text-end' as const, id: 't' },
    finish('stop'),
  ],
];

type StreamPart = (typeof steps)[number][number];

const scripted = () => {
  let call = 0;
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream<StreamPart>({ chunks: steps[call++]!, chunkDelayInMs: null }),
    }),
  });
};

const request = parseAskRequest({
  messages: [{ id: 'q', role: 'user', parts: [{ type: 'text', text: 'Are you available?' }] }],
  surface: 'portfolio',
  locale: 'fr',
});
if (!request.success) throw new Error('the sample request is invalid');

async function chunksOf(response: Response) {
  const chunks: UIMessageChunk[] = [];
  const text = await response.text();
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') chunks.push(JSON.parse(line.slice(6)));
  }
  return chunks;
}

async function messageOf(chunks: UIMessageChunk[]) {
  let last: Message | undefined;
  const stream = simulateReadableStream({ chunks, initialDelayInMs: null, chunkDelayInMs: null });
  for await (const message of readUIMessageStream<Message>({ stream })) last = message;
  return last!;
}

describe('answer', () => {
  it('streams the step, the text, the sources and the action, with the corpus in its instructions', async () => {
    const model = scripted();
    const log = vi.fn();
    const response = answer({ request: request.data, corpus: sampleCorpus(), model, today: '2026-11-28', log });

    const chunks = await chunksOf(response);
    expect(chunks).toContainEqual({ type: 'data-status', data: 'resume', transient: true });
    const message = await messageOf(chunks.filter((chunk) => !('transient' in chunk && chunk.transient)));
    expect(textOf(message)).toBe('Yes, I am available right away.');
    expect(sourcesOf(message)).toEqual([{ type: 'source-url', sourceId: 'profile', url: '/fr/resume', title: 'CV' }]);
    expect(actionOf(message)).toBe('book');

    const prompt = model.doStreamCalls[0]!.prompt;
    expect(JSON.stringify(prompt[0])).toContain('You are the AI version of Lény Sauzet');
    expect(JSON.stringify(prompt[0])).toContain('reading the portfolio in French');
    expect(model.doStreamCalls[0]!.maxOutputTokens).toBe(600);
    expect(model.doStreamCalls.map((call) => call.toolChoice?.type)).toEqual(['required', 'none']);
  });

  it('logs the turn without a word of the conversation', async () => {
    const model = scripted();
    const log = vi.fn();
    await (await answer({ request: request.data, corpus: sampleCorpus(), model, log })).text();

    expect(log).toHaveBeenCalledOnce();
    const entry = log.mock.calls[0]![0];
    expect(entry).toMatchObject({ event: 'ask', locale: 'fr', steps: 2, tools: ['read', 'offer'], inputTokens: 1800 });
    expect(JSON.stringify(entry)).not.toMatch(/available/i);
  });

  it('ends a failing model with the unavailable code, never its error', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error('Gateway key sk-secret rejected');
      },
    });
    const log = vi.fn();
    const chunks = await chunksOf(answer({ request: request.data, corpus: sampleCorpus(), model, log }));
    expect(chunks).toContainEqual({ type: 'error', errorText: STREAM_FAILURE });
    expect(JSON.stringify(chunks)).not.toContain('sk-secret');
    expect(JSON.stringify(log.mock.calls)).not.toContain('sk-secret');
    expect(log.mock.calls.filter(([entry]) => entry.event === 'ask-error')).toHaveLength(1);
  });
});
