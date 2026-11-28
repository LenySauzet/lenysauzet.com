import { describe, expect, it } from 'vitest';

import { actionOf, sourcesOf, textOf } from './conversation';
import { demoReply } from './demo';

const sentences = {
  available: 'Yes.',
  availableSource: 'Resume',
  tolk: 'At Tolk.ai.',
  tolkSource: 'Resume · Tolk',
  built: 'Ankhora, GitGlow.',
};
const reply = (question: string, locale: 'en' | 'fr' = 'en') => {
  const { step, parts } = demoReply(question, locale, sentences, '/resume');
  return { step, message: { id: 'a', role: 'assistant' as const, parts } };
};

describe('the demo replies', () => {
  it('answers availability from the resume, with a call to book', () => {
    const { step, message } = reply('Are you available?');
    expect(step).toBe('resume');
    expect(textOf(message)).toBe('Yes.');
    expect(actionOf(message)).toBe('book');
    expect(actionOf(reply('Êtes-vous disponible ?', 'fr').message)).toBe('book');
  });

  it('answers what was built from the projects, each one a source', () => {
    const { step, message } = reply('What have you built?');
    expect(step).toBe('projects');
    expect(textOf(message)).toBe('Ankhora, GitGlow.');
    expect(sourcesOf(message).map((source) => source.title)).toEqual(['Ankhora', 'GitGlow', 'Travel Order Resolver']);
    expect(actionOf(message)).toBeUndefined();
    expect(reply('Qu’avez-vous construit ?', 'fr').step).toBe('projects');
  });

  it('answers anything else with the work at Tolk.ai and the resume', () => {
    const { message } = reply('Your role at Tolk.ai?');
    expect(textOf(message)).toBe('At Tolk.ai.');
    expect(sourcesOf(message).map((source) => source.title)).toEqual(['Resume · Tolk', 'tolk.ai']);
    expect(actionOf(message)).toBe('resume');
  });
});
