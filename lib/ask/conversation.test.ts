import { describe, expect, it } from 'vitest';

import { isBusy, isThinking, labelOf, turnsOf, type Message } from './conversation';

const user = (id: string, text = 'Hi'): Message => ({ id, role: 'user', parts: [{ type: 'text', text }] });
const assistant = (id: string, text = ''): Message => ({
  id,
  role: 'assistant',
  parts: text ? [{ type: 'text', text }] : [],
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
