import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Message, Status } from '@/lib/ask/conversation';
import { InEnglish } from '@/test/intl';

import { Conversation } from './Conversation';

const question: Message = { id: 'q', role: 'user', parts: [{ type: 'text', text: 'Are you available?' }] };

const show = (messages: Message[], status: Status, onRetry = vi.fn()) => {
  render(
    <Conversation
      messages={messages}
      status={status}
      avatarRef={createRef()}
      onRestart={vi.fn()}
      onRetry={onRetry}
      onClose={vi.fn()}
    />,
    { wrapper: InEnglish }
  );
  return onRetry;
};

describe('Conversation', () => {
  it('thinks under a question before any answer exists', () => {
    show([question], 'submitted');
    expect(screen.getByRole('log')).toHaveTextContent('Thinking…');
  });

  it('says when an answer failed and asks it again', () => {
    const onRetry = show([question], 'error');
    expect(screen.getByRole('status')).toHaveTextContent('Something went wrong.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('opens an outside source in a new tab and names an untitled one by its host', () => {
    show(
      [
        question,
        {
          id: 'a',
          role: 'assistant',
          parts: [
            { type: 'text', text: 'Yes.' },
            { type: 'source-url', sourceId: 'tolk', url: 'https://tolk.ai/' },
          ],
        },
      ],
      'ready'
    );
    expect(screen.getByRole('link', { name: 'tolk.ai' })).toHaveAttribute('target', '_blank');
  });
});
