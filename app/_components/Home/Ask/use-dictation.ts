'use client';

import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { SPEECH_LOCALES } from '@/i18n/locales';

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionClass = new () => Recognition;

const recognitionClass = () => {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionClass;
    webkitSpeechRecognition?: RecognitionClass;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
};

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

  const cancel = useCallback(() => {
    const session = recognition.current;
    if (!session) return;
    recognition.current = null;
    session.abort();
    setListening(false);
  }, []);

  useEffect(() => cancel, [cancel]);

  const toggle = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    const Recognition = recognitionClass();
    if (!Recognition) return;
    const session = new Recognition();
    const current = () => recognition.current === session;
    const end = () => {
      if (!current()) return;
      recognition.current = null;
      setListening(false);
    };
    session.lang = SPEECH_LOCALES[locale];
    session.interimResults = true;
    session.continuous = false;
    session.onresult = (event) => {
      if (!current()) return;
      deliver.current(
        Array.from(event.results)
          .map((result) => result[0]?.transcript ?? '')
          .join('')
      );
    };
    session.onerror = end;
    session.onend = end;
    recognition.current = session;
    session.start();
    setListening(true);
  }, [locale]);

  return { supported, listening, toggle, cancel };
}
