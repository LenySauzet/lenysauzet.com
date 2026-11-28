import { describe, expect, it } from 'vitest';

import { exchangesOf, MAX_MESSAGES, MAX_QUESTION, parseAskRequest } from './request';

const question = (text: string, id = 'q') => ({ id, role: 'user', parts: [{ type: 'text', text }] });
const reply = (text: string, id = 'a') => ({
  id,
  role: 'assistant',
  parts: [
    { type: 'step-start' },
    { type: 'text', text },
    { type: 'source-url', sourceId: 'profile', url: '/resume' },
    { type: 'data-action', data: 'book' },
  ],
});
const body = (messages: unknown[], extra = {}) => ({ messages, surface: 'portfolio', locale: 'en', ...extra });

describe('parseAskRequest', () => {
  it('accepts a conversation that ends on a question', () => {
    expect(parseAskRequest(body([question('Hi'), reply('Hello.'), question('Are you available?')])).success).toBe(true);
  });

  it('refuses a question too long, too many messages, a part that is not text, or an unknown surface', () => {
    expect(parseAskRequest(body([question('x'.repeat(MAX_QUESTION + 1))])).success).toBe(false);
    const long = Array.from({ length: MAX_MESSAGES + 1 }, (_, index) =>
      index % 2 ? reply('Yes.', `a${index}`) : question('Hi', `q${index}`)
    );
    expect(parseAskRequest(body(long)).success).toBe(false);
    const file = { id: 'q', role: 'user', parts: [{ type: 'file', url: 'data:,x', mediaType: 'text/plain' }] };
    expect(parseAskRequest(body([file])).success).toBe(false);
    expect(parseAskRequest(body([question('Hi')], { surface: 'blog' })).success).toBe(false);
    expect(parseAskRequest(body([question('Hi')], { locale: 'de' })).success).toBe(false);
    expect(parseAskRequest(body([question('Hi'), reply('Hello.')])).success).toBe(false);
    expect(parseAskRequest(undefined).success).toBe(false);
  });

  it('keeps only the text of each turn for the model', () => {
    const parsed = parseAskRequest(body([question('Hi'), reply('Hello.'), question('More?')]));
    expect(parsed.success && exchangesOf(parsed.data)).toEqual([
      { role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
      { role: 'assistant', parts: [{ type: 'text', text: 'Hello.' }] },
      { role: 'user', parts: [{ type: 'text', text: 'More?' }] },
    ]);
  });
});
