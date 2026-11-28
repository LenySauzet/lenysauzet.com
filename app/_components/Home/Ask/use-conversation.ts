'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type ChatTransport } from 'ai';
import { useLocale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import { failureFrom, isBusy, textOf, type Message, type Notice, type Step } from '@/lib/ask/conversation';

export const ASK_API = '/api/ask';
export const SENT_MESSAGES = 10;

export const requestBody = (messages: Message[], locale: string, body?: object) => ({
  ...body,
  surface: 'portfolio',
  locale,
  messages: messages.slice(-SENT_MESSAGES),
});

export function useConversation(transport?: ChatTransport<Message>) {
  const locale = useLocale();
  const [step, setStep] = useState<Step>();
  const [notices, setNotices] = useState<Record<string, Notice>>({});
  const chatTransport = useMemo<ChatTransport<Message>>(
    () =>
      transport ??
      new DefaultChatTransport<Message>({
        api: ASK_API,
        prepareSendMessagesRequest: ({ messages, body }) => ({ body: requestBody(messages, locale, body) }),
      }),
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
  const last = messages.at(-1);
  const writing = last?.role === 'assistant' && textOf(last) !== '';
  const question = messages.findLast((message) => message.role === 'user');

  const note = useCallback(
    (notice?: Notice) => {
      if (!question) return;
      setNotices((current) => {
        const rest = Object.fromEntries(Object.entries(current).filter(([id]) => id !== question.id));
        return notice ? { ...rest, [question.id]: notice } : rest;
      });
    },
    [question]
  );

  const send = useCallback(
    (input: string) => {
      const text = input.trim();
      if (!text || busy) return;
      setStep(undefined);
      if (error) {
        note(failureFrom(error));
        clearError();
      }
      void sendMessage({ text });
    },
    [busy, error, note, clearError, sendMessage]
  );

  const retry = useCallback(() => {
    if (busy || !question) return;
    setStep(undefined);
    note();
    clearError();
    if (last?.role === 'user' || (last && !textOf(last))) {
      setMessages(messages.slice(0, messages.indexOf(question)));
      void sendMessage({ text: textOf(question) });
    } else void regenerate();
  }, [busy, question, last, messages, note, clearError, setMessages, sendMessage, regenerate]);

  const stop = useCallback(() => {
    if (!busy) return;
    if (!writing) note('stopped');
    void abort();
  }, [busy, writing, note, abort]);

  const reset = useCallback(() => {
    void abort();
    clearError();
    setMessages([]);
    setNotices({});
    setStep(undefined);
  }, [abort, clearError, setMessages]);

  return {
    messages,
    status,
    step: busy && !writing ? step : undefined,
    notices: error && question ? { ...notices, [question.id]: failureFrom(error) } : notices,
    send,
    retry,
    stop,
    reset,
  };
}
