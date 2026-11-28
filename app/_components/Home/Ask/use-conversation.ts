'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type ChatTransport } from 'ai';
import { useLocale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import { failureFrom, isBusy, textOf, type Message, type Step } from '@/lib/ask/conversation';

export const ASK_API = '/api/ask';

export function useConversation(transport?: ChatTransport<Message>) {
  const locale = useLocale();
  const [step, setStep] = useState<Step>();
  const chatTransport = useMemo<ChatTransport<Message>>(
    () => transport ?? new DefaultChatTransport<Message>({ api: ASK_API, body: { surface: 'portfolio', locale } }),
    [transport, locale]
  );
  const chat = useChat<Message>({
    transport: chatTransport,
    onData: (part) => {
      if (part.type === 'data-status') setStep(part.data);
    },
  });
  const { messages, status, error, sendMessage, regenerate, stop: abort, setMessages, clearError } = chat;
  const busy = isBusy(status);
  const writing = messages.at(-1)?.role === 'assistant' && textOf(messages.at(-1)!) !== '';

  const send = useCallback(
    (input: string) => {
      const text = input.trim();
      if (!text || busy) return;
      setStep(undefined);
      void sendMessage({ text });
    },
    [busy, sendMessage]
  );

  const retry = useCallback(() => {
    if (busy || !messages.some((message) => message.role === 'user')) return;
    setStep(undefined);
    clearError();
    if (messages.at(-1)?.role === 'user') {
      const question = messages.at(-1)!;
      setMessages(messages.slice(0, -1));
      void sendMessage({ text: textOf(question) });
    } else void regenerate();
  }, [busy, messages, clearError, setMessages, sendMessage, regenerate]);

  const stop = useCallback(() => {
    if (busy) void abort();
  }, [busy, abort]);

  const reset = useCallback(() => {
    void abort();
    clearError();
    setMessages([]);
    setStep(undefined);
  }, [abort, clearError, setMessages]);

  return {
    messages,
    status,
    step: busy && !writing ? step : undefined,
    failure: error ? failureFrom(error) : undefined,
    send,
    retry,
    stop,
    reset,
  };
}
