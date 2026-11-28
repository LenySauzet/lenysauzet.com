import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type LanguageModel,
} from 'ai';

import { getPathname } from '@/i18n/navigation';
import type { Message } from '@/lib/ask/conversation';

import { buildInstructions } from './instructions';
import type { Corpus } from './knowledge/corpus';
import { MAX_OUTPUT_TOKENS, MAX_STEPS, providerOptions } from './model';
import { PROMPT_VERSION } from './prompts/version';
import { exchangesOf, type AskRequest } from './request';
import { offerTool } from './tools/offer';
import { libraryOf, readTool } from './tools/read';

const RESUME_TITLE = { en: 'Resume', fr: 'CV' } as const;

export const STREAM_FAILURE = JSON.stringify({ code: 'unavailable' });

export interface AnswerInput {
  request: AskRequest;
  corpus: Corpus;
  model: LanguageModel;
  signal?: AbortSignal;
  today?: string;
  log?: (entry: Record<string, unknown>) => void;
}

export function answer({ request, corpus, model, signal, today, log = console.info }: AnswerInput) {
  const { locale } = request;
  const started = Date.now();
  const library = libraryOf(corpus, {
    title: RESUME_TITLE[locale],
    url: getPathname({ href: '/resume', locale }),
  });

  const failed = (error: unknown) => {
    log({ event: 'ask-error', prompt: PROMPT_VERSION, error: error instanceof Error ? error.name : 'unknown' });
    return STREAM_FAILURE;
  };

  const stream = createUIMessageStream<Message>({
    execute: async ({ writer }) => {
      writer.write({ type: 'start' });
      const result = streamText({
        model,
        instructions: buildInstructions({ corpus, locale, today: today ?? new Date().toISOString().slice(0, 10) }),
        messages: await convertToModelMessages(exchangesOf(request)),
        tools: { read: readTool(library, writer), offer: offerTool(writer) },
        stopWhen: isStepCount(MAX_STEPS),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        reasoning: 'none',
        abortSignal: signal,
        providerOptions,
        onError: ({ error }) => failed(error),
        onFinish: ({ steps, totalUsage, finishReason }) =>
          log({
            event: 'ask',
            prompt: PROMPT_VERSION,
            locale,
            turns: request.messages.length,
            steps: steps.length,
            tools: steps.flatMap((step) => step.toolCalls.map((call) => call.toolName)),
            inputTokens: totalUsage.inputTokens,
            outputTokens: totalUsage.outputTokens,
            finishReason,
            ms: Date.now() - started,
          }),
      });
      writer.merge(toUIMessageStream({ stream: result.stream, sendStart: false, onError: () => STREAM_FAILURE }));
    },
    onError: failed,
  });

  return createUIMessageStreamResponse({ stream, headers: { 'Cache-Control': 'no-store' } });
}
