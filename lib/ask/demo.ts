import type { Locale } from 'next-intl';

import type { Part } from './conversation';

export interface DemoSentences {
  available: string;
  availableSource: string;
  tolk: string;
  tolkSource: string;
}

const ABOUT_AVAILABILITY: Record<Locale, RegExp> = {
  en: /availab|open to|hire|full-time|freelance/i,
  fr: /dispo|libre|poste|cdi|freelance/i,
};

export function demoReply(question: string, locale: Locale, sentences: DemoSentences, resume: string): Part[] {
  if (ABOUT_AVAILABILITY[locale].test(question)) {
    return [
      { type: 'text', text: sentences.available },
      { type: 'source-url', sourceId: 'resume', url: resume, title: sentences.availableSource },
      { type: 'data-action', data: 'book' },
    ];
  }
  return [
    { type: 'text', text: sentences.tolk },
    { type: 'source-url', sourceId: 'resume', url: resume, title: sentences.tolkSource },
    { type: 'source-url', sourceId: 'tolk', url: 'https://tolk.ai', title: 'tolk.ai' },
    { type: 'data-action', data: 'resume' },
  ];
}

export const wordsOf = (text: string) => text.split(/(?<=\s)/);
