'use client';

import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type RecognitionClass = new () => Recognition;

const recognitionClass = () => {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionClass;
    webkitSpeechRecognition?: RecognitionClass;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
};

const LANGUAGES = { en: 'en-US', fr: 'fr-FR' } as const;

const never = () => () => {};

export function useDictation(onText: (text: string) => void) {
  const locale = useLocale();
  const supported = useSyncExternalStore(
    never,
    () => Boolean(recognitionClass()),
    () => false
  );
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const deliver = useRef(onText);

  useEffect(() => {
    deliver.current = onText;
  }, [onText]);

  useEffect(() => () => recognition.current?.stop(), []);

  const toggle = useCallback(() => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Recognition = recognitionClass();
    if (!Recognition) return;
    const session = new Recognition();
    session.lang = LANGUAGES[locale];
    session.interimResults = true;
    session.continuous = false;
    session.onresult = (event) =>
      deliver.current(
        Array.from(event.results)
          .map((result) => result[0]?.transcript ?? '')
          .join('')
      );
    session.onend = () => setListening(false);
    recognition.current = session;
    session.start();
    setListening(true);
  }, [listening, locale]);

  return { supported, listening, toggle };
}
