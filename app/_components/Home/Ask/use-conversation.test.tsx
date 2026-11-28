import { act, renderHook, waitFor } from '@testing-library/react';
import type { ChatTransport } from 'ai';
import { describe, expect, it } from 'vitest';

import { actionOf, sourcesOf, textOf, type Message } from '@/lib/ask/conversation';
import { chunksOf, controlledTransport, refusingTransport } from '@/test/ask';
import { InEnglish } from '@/test/intl';

import { useConversation } from './use-conversation';

const start = (transport: ChatTransport<Message>) =>
  renderHook(() => useConversation(transport), { wrapper: InEnglish });

const roles = (messages: Message[]) => messages.map((message) => message.role);

describe('useConversation', () => {
  it('thinks with no reply and names its step, streams once words arrive, then is ready with sources and action', async () => {
    const { transport, line } = controlledTransport();
    const { result } = start(transport);

    act(() => result.current.send('Are you available?'));
    await waitFor(() => expect(result.current.status).toBe('submitted'));
    await act(async () => line().push({ type: 'start' }, { type: 'data-status', data: 'resume', transient: true }));
    await waitFor(() => expect(result.current.step).toBe('resume'));
    expect(roles(result.current.messages)).toEqual(['user']);

    await act(async () => line().push({ type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Yes.' }));
    await waitFor(() => expect(result.current.status).toBe('streaming'));
    expect(result.current.step).toBeUndefined();

    await act(async () => {
      line().push(
        { type: 'text-end', id: 't' },
        { type: 'source-url', sourceId: 'profile', url: '/resume', title: 'Resume' },
        { type: 'data-action', data: 'book' },
        { type: 'finish' }
      );
      line().close();
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const reply = result.current.messages[1]!;
    expect(textOf(reply)).toBe('Yes.');
    expect(sourcesOf(reply).map((source) => source.title)).toEqual(['Resume']);
    expect(actionOf(reply)).toBe('book');
    expect(reply.parts.some((part) => part.type === 'data-status')).toBe(false);
  });

  it('ignores a question sent while one is on its way', async () => {
    const { transport } = controlledTransport();
    const { result } = start(transport);
    act(() => result.current.send('Are you available?'));
    await waitFor(() => expect(result.current.status).toBe('submitted'));
    act(() => result.current.send('And after?'));
    expect(result.current.messages.filter((message) => message.role === 'user')).toHaveLength(1);
  });

  it('reads a refusal by its code, and treats anything unreadable as unavailable', async () => {
    const refused = start(refusingTransport('rate-limited'));
    act(() => refused.result.current.send('Hi'));
    await waitFor(() => expect(refused.result.current.status).toBe('error'));
    expect(refused.result.current.failure).toBe('rate-limited');

    const { transport, line } = controlledTransport();
    const broken = start(transport);
    act(() => broken.result.current.send('Hi'));
    await waitFor(() => expect(broken.result.current.status).toBe('submitted'));
    await act(async () => line().fail('Something broke'));
    await waitFor(() => expect(broken.result.current.status).toBe('error'));
    expect(broken.result.current.failure).toBe('unavailable');
  });

  it('stops mid-answer and keeps what was written', async () => {
    const { transport, line } = controlledTransport();
    const { result } = start(transport);
    act(() => result.current.send('Are you available?'));
    await waitFor(() => expect(result.current.status).toBe('submitted'));
    await act(async () =>
      line().push({ type: 'start' }, { type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Yes, ' })
    );
    await waitFor(() => expect(result.current.status).toBe('streaming'));

    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(textOf(result.current.messages[1]!)).toBe('Yes, ');
    expect(result.current.failure).toBeUndefined();
  });

  it('asks a refused question again on retry, and forgets everything on reset', async () => {
    let refuse = true;
    const { transport: answering, line } = controlledTransport();
    const transport: ChatTransport<Message> = {
      sendMessages: (options) =>
        refuse ? refusingTransport('unavailable').sendMessages(options) : answering.sendMessages(options),
      reconnectToStream: async () => null,
    };
    const { result } = start(transport);
    act(() => result.current.send('Are you available?'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    refuse = false;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('submitted'));
    await act(async () => {
      line().push(...chunksOf({ words: ['Yes.'] }));
      line().close();
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(roles(result.current.messages)).toEqual(['user', 'assistant']);
    expect(textOf(result.current.messages[0]!)).toBe('Are you available?');

    act(() => result.current.reset());
    await waitFor(() => expect(result.current.messages).toEqual([]));
    expect(result.current.failure).toBeUndefined();
  });
});
