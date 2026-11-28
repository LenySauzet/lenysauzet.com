import type { Locale } from 'next-intl';

import siteConfig from '@/config/site';

import type { Part, Step } from './conversation';

export interface DemoSentences {
  available: string;
  availableSource: string;
  tolk: string;
  tolkSource: string;
  built: string;
}

export interface DemoReply {
  step: Step;
  parts: Part[];
}

const ABOUT_AVAILABILITY: Record<Locale, RegExp> = {
  en: /availab|open to|hire|full-time|freelance/i,
  fr: /dispo|libre|poste|cdi|freelance/i,
};

const ABOUT_PROJECTS: Record<Locale, RegExp> = {
  en: /built|project|made/i,
  fr: /construit|projet|réalis/i,
};

const PROJECTS: Part[] = [
  { type: 'source-url', sourceId: 'ankhora', url: `${siteConfig.social.github}/Ankhora`, title: 'Ankhora' },
  { type: 'source-url', sourceId: 'gitglow', url: 'https://gitglow.lenysauzet.com', title: 'GitGlow' },
  {
    type: 'source-url',
    sourceId: 'travel-order-resolver',
    url: `${siteConfig.social.github}/travel-order-resolver`,
    title: 'Travel Order Resolver',
  },
];

export function demoReply(question: string, locale: Locale, sentences: DemoSentences, resume: string): DemoReply {
  if (ABOUT_AVAILABILITY[locale].test(question)) {
    return {
      step: 'resume',
      parts: [
        { type: 'text', text: sentences.available },
        { type: 'source-url', sourceId: 'resume', url: resume, title: sentences.availableSource },
        { type: 'data-action', data: 'book' },
      ],
    };
  }
  if (ABOUT_PROJECTS[locale].test(question)) {
    return { step: 'projects', parts: [{ type: 'text', text: sentences.built }, ...PROJECTS] };
  }
  return {
    step: 'resume',
    parts: [
      { type: 'text', text: sentences.tolk },
      { type: 'source-url', sourceId: 'resume', url: resume, title: sentences.tolkSource },
      { type: 'source-url', sourceId: 'tolk', url: 'https://tolk.ai', title: 'tolk.ai' },
      { type: 'data-action', data: 'resume' },
    ],
  };
}
