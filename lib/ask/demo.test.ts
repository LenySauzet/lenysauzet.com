import { describe, expect, it } from 'vitest';

import { actionOf, sourcesOf, textOf } from './conversation';
import { demoReply, wordsOf } from './demo';

const sentences = { available: 'Yes.', availableSource: 'Resume', tolk: 'At Tolk.ai.', tolkSource: 'Resume · Tolk' };
const message = (question: string, locale: 'en' | 'fr' = 'en') => ({
  id: 'a',
  role: 'assistant' as const,
  parts: demoReply(question, locale, sentences, '/resume'),
});

describe('the demo replies', () => {
  it('answers availability with a call to book', () => {
    expect(textOf(message('Are you available?'))).toBe('Yes.');
    expect(actionOf(message('Are you available?'))).toBe('book');
    expect(actionOf(message('Es-tu disponible ?', 'fr'))).toBe('book');
  });

  it('answers anything else with the work at Tolk.ai and the resume', () => {
    const reply = message('Your role at Tolk.ai?');
    expect(textOf(reply)).toBe('At Tolk.ai.');
    expect(sourcesOf(reply).map((source) => source.title)).toEqual(['Resume · Tolk', 'tolk.ai']);
    expect(actionOf(reply)).toBe('resume');
  });

  it('splits words with their spaces, so joining them gives the text back', () => {
    expect(wordsOf('one two  three').join('')).toBe('one two  three');
  });
});
