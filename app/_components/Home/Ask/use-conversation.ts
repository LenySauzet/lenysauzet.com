'use client';

import { useLocale, useMessages } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getPathname } from '@/i18n/navigation';
import { textOf, type Message, type Status } from '@/lib/ask/conversation';
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

  const send = useCallback(
    (question: string) => {
      const text = question.trim();
      if (!text || status !== 'ready') return;
      const parts = demoReply(text, locale, sentences, getPathname({ href: '/resume', locale }));
      const answer = `m${(count.current += 2)}`;
      const words = wordsOf(textOf({ id: answer, role: 'assistant', parts }));
      const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
      const write = (shown: number) =>
        setMessages((current) =>
          current.map((message) =>
            message.id === answer
              ? { ...message, parts: [{ type: 'text', text: words.slice(0, shown).join('') }] }
              : message
          )
        );

      setMessages((current) => [
        ...current,
        { id: `m${count.current - 1}`, role: 'user', parts: [{ type: 'text', text }] },
        { id: answer, role: 'assistant', parts: [] },
      ]);
      setStatus('submitted');
      words.forEach((_, index) =>
        later(THINKING_MS + index * WORD_MS, () => {
          if (index === 0) setStatus('streaming');
          write(index + 1);
        })
      );
      later(THINKING_MS + words.length * WORD_MS, () => {
        setMessages((current) => current.map((message) => (message.id === answer ? { ...message, parts } : message)));
        setStatus('ready');
      });
    },
    [locale, sentences, status]
  );

  const reset = useCallback(() => {
    stop();
    setMessages([]);
    setStatus('ready');
  }, [stop]);

  return { messages, status, send, reset };
}
