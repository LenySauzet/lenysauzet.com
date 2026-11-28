'use client';

import { useLocale, useMessages } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getPathname } from '@/i18n/navigation';
import { isBusy, textOf, type Message, type Status } from '@/lib/ask/conversation';
import { demoReply, wordsOf } from '@/lib/ask/demo';

const THINKING_MS = 1800;
const WORD_MS = 38;

export function useConversation() {
  const locale = useLocale();
  const sentences = useMessages().Ask.demo;
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('ready');
  const timers = useRef<number[]>([]);
  const count = useRef(0);

  const stop = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => stop, [stop]);

  const answer = useCallback(
    (question: string) => {
      const parts = demoReply(question, locale, sentences, getPathname({ href: '/resume', locale }));
      const id = `m${++count.current}`;
      const words = wordsOf(textOf({ id, role: 'assistant', parts }));
      const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
      const write = (reply: Message) =>
        setMessages((current) => (current.at(-1)?.id === id ? [...current.slice(0, -1), reply] : [...current, reply]));

      setStatus('submitted');
      words.forEach((_, index) =>
        later(THINKING_MS + index * WORD_MS, () => {
          if (index === 0) setStatus('streaming');
          write({ id, role: 'assistant', parts: [{ type: 'text', text: words.slice(0, index + 1).join('') }] });
        })
      );
      later(THINKING_MS + words.length * WORD_MS, () => {
        write({ id, role: 'assistant', parts });
        setStatus('ready');
      });
    },
    [locale, sentences]
  );

  const send = useCallback(
    (input: string) => {
      const text = input.trim();
      if (!text || isBusy(status)) return;
      const question: Message = { id: `m${++count.current}`, role: 'user', parts: [{ type: 'text', text }] };
      setMessages((current) => [...current, question]);
      answer(text);
    },
    [answer, status]
  );

  const retry = useCallback(() => {
    const question = messages.findLast((message) => message.role === 'user');
    if (!question || isBusy(status)) return;
    setMessages((current) => current.slice(0, current.indexOf(question) + 1));
    answer(textOf(question));
  }, [answer, messages, status]);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
    setStatus('ready');
  }, [stop]);

  return { messages, status, send, retry, reset };
}
