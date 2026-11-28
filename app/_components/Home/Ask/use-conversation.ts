'use client';

import { useLocale, useMessages } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getPathname } from '@/i18n/navigation';
import { isBusy, textOf, wordsOf, type Failure, type Message, type Status } from '@/lib/ask/conversation';
import { demoReply } from '@/lib/ask/demo';

const THINKING_MS = 1800;
const WORD_MS = 38;

export function useConversation() {
  const locale = useLocale();
  const { demo } = useMessages().Ask;
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('ready');
  const [step, setStep] = useState<string>();
  const [failure, setFailure] = useState<Failure>();
  const timers = useRef<number[]>([]);
  const count = useRef(0);

  const clear = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setStep(undefined);
  }, []);

  useEffect(() => clear, [clear]);

  const answer = useCallback(
    (question: string) => {
      const reply = demoReply(question, locale, demo, getPathname({ href: '/resume', locale }));
      const id = `m${++count.current}`;
      const words = wordsOf(textOf({ id, role: 'assistant', parts: reply.parts }));
      const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
      const write = (message: Message) =>
        setMessages((current) =>
          current.at(-1)?.id === id ? [...current.slice(0, -1), message] : [...current, message]
        );

      setFailure(undefined);
      setStatus('submitted');
      setStep(demo.steps[reply.step]);
      words.forEach((_, index) =>
        later(THINKING_MS + index * WORD_MS, () => {
          if (index === 0) {
            setStep(undefined);
            setStatus('streaming');
          }
          write({ id, role: 'assistant', parts: [{ type: 'text', text: words.slice(0, index + 1).join('') }] });
        })
      );
      later(THINKING_MS + words.length * WORD_MS, () => {
        write({ id, role: 'assistant', parts: reply.parts });
        setStatus('ready');
      });
    },
    [locale, demo]
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

  const stop = useCallback(() => {
    if (!isBusy(status)) return;
    clear();
    setStatus('ready');
  }, [clear, status]);

  const reset = useCallback(() => {
    clear();
    setMessages([]);
    setFailure(undefined);
    setStatus('ready');
  }, [clear]);

  return { messages, status, step, failure, send, retry, stop, reset };
}
