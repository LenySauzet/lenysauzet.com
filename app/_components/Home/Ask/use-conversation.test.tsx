import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { textOf } from '@/lib/ask/conversation';
import { InEnglish } from '@/test/intl';

import { useConversation } from './use-conversation';

const start = () => renderHook(useConversation, { wrapper: InEnglish });

describe('useConversation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('answers as the AI SDK does: no reply until its first words, then streaming, then ready', () => {
    const { result } = start();
    act(() => result.current.send('Are you available?'));
    expect(result.current.status).toBe('submitted');
    expect(result.current.messages.map((message) => message.role)).toEqual(['user']);

    act(() => vi.advanceTimersByTime(1800));
    expect(result.current.status).toBe('streaming');
    expect(result.current.messages.map((message) => message.role)).toEqual(['user', 'assistant']);

    act(() => vi.advanceTimersByTime(8000));
    expect(result.current.status).toBe('ready');
    expect(result.current.messages).toHaveLength(2);
    expect(textOf(result.current.messages[1]!)).toMatch(/^Yes\. My work-study/);
  });

  it('ignores a question sent while one is on its way', () => {
    const { result } = start();
    act(() => result.current.send('Are you available?'));
    act(() => result.current.send('And after?'));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.messages.filter((message) => message.role === 'user')).toHaveLength(1);
  });

  it('forgets a question still being answered when starting over', () => {
    const { result } = start();
    act(() => result.current.send('Are you available?'));
    act(() => vi.advanceTimersByTime(500));
    act(() => result.current.reset());
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.messages).toEqual([]);
    expect(result.current.status).toBe('ready');
  });
});
