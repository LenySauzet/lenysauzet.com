import { describe, expect, it } from 'vitest';

import { failureFrom, isBusy, isThinking, labelOf, remediesOf, turnsOf, wordsOf, type Message } from './conversation';

const user = (id: string, text = 'Hi'): Message => ({ id, role: 'user', parts: [{ type: 'text', text }] });
const assistant = (id: string, text = ''): Message => ({
  id,
  role: 'assistant',
  parts: text ? [{ type: 'text', text }] : [],
});

describe('failureFrom', () => {
  it('reads the code the server answered with, and calls anything else unavailable', () => {
    expect(failureFrom(new Error('{"code":"rate-limited"}'))).toBe('rate-limited');
    expect(failureFrom(new Error('{"code":"teapot"}'))).toBe('unavailable');
    expect(failureFrom(new Error('Failed to fetch'))).toBe('unavailable');
    expect(failureFrom(undefined)).toBe('unavailable');
  });
});

describe('remediesOf', () => {
  it('offers a retry only when trying again can help, and a direct contact when the assistant cannot answer', () => {
    expect(remediesOf('unavailable')).toEqual({ retry: true, contact: true });
    expect(remediesOf('disabled')).toEqual({ retry: false, contact: true });
    expect(remediesOf('rate-limited')).toEqual({ retry: false, contact: false });
    expect(remediesOf('invalid')).toEqual({ retry: false, contact: false });
  });
});

describe('wordsOf', () => {
  it('splits words with their spaces, so joining them gives the text back', () => {
    expect(wordsOf('one two  three').join('')).toBe('one two  three');
  });
});

describe('turnsOf', () => {
  it('pairs each question with the answer that follows it', () => {
    const turns = turnsOf([user('a'), assistant('b', 'Yes'), user('c')]);
    expect(turns.map((turn) => [turn.question.id, turn.answer?.id])).toEqual([
      ['a', 'b'],
      ['c', undefined],
    ]);
  });

  it('keeps the latest answer when a turn streams several', () => {
    expect(turnsOf([user('a'), assistant('b'), assistant('c')])[0]?.answer?.id).toBe('c');
  });

  it('ignores an answer with no question before it', () => {
    expect(turnsOf([assistant('a'), user('b')]).map((turn) => turn.question.id)).toEqual(['b']);
  });
});

describe('isThinking', () => {
  it('thinks from the question until the first words, whether or not an empty answer exists', () => {
    expect(isThinking([user('a')], 'submitted')).toBe(true);
    expect(isThinking([user('a'), assistant('b')], 'streaming')).toBe(true);
    expect(isThinking([user('a'), assistant('b', 'Yes')], 'streaming')).toBe(false);
  });

  it('stops thinking once ready or failed', () => {
    expect(isThinking([user('a')], 'ready')).toBe(false);
    expect(isThinking([user('a')], 'error')).toBe(false);
  });
});

describe('isBusy', () => {
  it('lets a question through only when nothing is on its way', () => {
    expect(['ready', 'submitted', 'streaming', 'error'].map((status) => isBusy(status as never))).toEqual([
      false,
      true,
      true,
      false,
    ]);
  });
});

describe('labelOf', () => {
  it('falls back to the host of an untitled source', () => {
    expect(labelOf({ type: 'source-url', sourceId: 's', url: 'https://www.tolk.ai/about' })).toBe('www.tolk.ai');
    expect(labelOf({ type: 'source-url', sourceId: 's', url: '/resume', title: 'Resume' })).toBe('Resume');
  });
});
