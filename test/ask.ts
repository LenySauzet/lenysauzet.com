import { createUIMessageStreamResponse, type ChatTransport, type UIMessageChunk } from 'ai';

import type { Action, Message, Source, Step } from '@/lib/ask/conversation';
import type { Corpus } from '@/lib/assistant/knowledge/corpus';

export interface Reply {
  step?: Step;
  words?: string[];
  sources?: Omit<Source, 'type'>[];
  action?: Action;
}

export const chunksOf = ({ step, words = [], sources = [], action }: Reply): UIMessageChunk[] => [
  { type: 'start' },
  ...(step ? [{ type: 'data-status', data: step, transient: true } as UIMessageChunk] : []),
  ...(words.length
    ? [
        { type: 'text-start', id: 'text' } as UIMessageChunk,
        ...words.map((delta): UIMessageChunk => ({ type: 'text-delta', id: 'text', delta })),
        { type: 'text-end', id: 'text' } as UIMessageChunk,
      ]
    : []),
  ...sources.map((source): UIMessageChunk => ({ type: 'source-url', ...source })),
  ...(action ? [{ type: 'data-action', data: action } as UIMessageChunk] : []),
  { type: 'finish' },
];

export interface Line {
  push: (...chunks: UIMessageChunk[]) => void;
  close: () => void;
  fail: (message: string) => void;
}

export function controlledTransport() {
  const lines: Line[] = [];
  const transport: ChatTransport<Message> = {
    sendMessages: async ({ abortSignal }) =>
      new ReadableStream<UIMessageChunk>({
        start(controller) {
          abortSignal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')));
          lines.push({
            push: (...chunks) => chunks.forEach((chunk) => controller.enqueue(chunk)),
            close: () => controller.close(),
            fail: (message) => controller.enqueue({ type: 'error', errorText: message }),
          });
        },
      }),
    reconnectToStream: async () => null,
  };
  return { transport, line: () => lines.at(-1)! };
}

export const refusingTransport = (code: string): ChatTransport<Message> => ({
  sendMessages: async () => {
    throw new Error(JSON.stringify({ code }));
  },
  reconnectToStream: async () => null,
});

const streamOf = (chunks: UIMessageChunk[], open = false, signal?: AbortSignal | null) =>
  new ReadableStream<UIMessageChunk>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      if (!open) controller.close();
      signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')));
    },
  });

export const askResponse = (reply: Reply) => createUIMessageStreamResponse({ stream: streamOf(chunksOf(reply)) });

export const pendingResponse = (step: Step, signal?: AbortSignal | null) =>
  createUIMessageStreamResponse({
    stream: streamOf([{ type: 'start' }, { type: 'data-status', data: step, transient: true }], true, signal),
  });

export const sampleCorpus = (): Corpus => ({
  profile: {
    headline: 'AI & Software Engineer',
    summary: 'I build software end to end.',
    availability: {
      status: 'open',
      start: 'immediately',
      roles: ['AI engineer'],
      locations: ['Montpellier, France'],
      contracts: ['permanent'],
      workAuthorization: 'EU citizen.',
    },
    languages: [{ name: 'French', level: 'native' }],
    education: [],
    experience: [],
    skills: [{ area: 'AI', items: ['RAG'] }],
    certifications: [],
    interests: [],
    recommendations: [],
  },
  stories: [
    {
      id: 'project:gitglow',
      slug: 'gitglow',
      title: 'GitGlow',
      year: '2024',
      status: 'shipped',
      role: 'solo',
      stack: ['Next.js'],
      app: 'https://gitglow.lenysauzet.com',
      blogPosts: [],
      summary: 'Covers for projects.',
      body: '## Context\n\nA README is judged by its cover.',
    },
  ],
  faq: [
    { id: 'faq:looking-for', question: 'What are you looking for?', topics: ['career'], answer: 'A permanent role.' },
  ],
  blog: {
    complete: true,
    posts: [
      {
        id: 'post:shaders',
        slug: 'shaders',
        url: 'https://blog.lenysauzet.com/posts/shaders',
        title: 'Shaders',
        description: 'How they work.',
        date: '2026-07-19',
        tags: [],
        body: 'A shader runs per pixel.',
      },
    ],
  },
});
