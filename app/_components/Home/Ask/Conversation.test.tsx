import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Failure, Message, Status } from '@/lib/ask/conversation';
import { InEnglish } from '@/test/intl';

import { Conversation } from './Conversation';

const question: Message = { id: 'q', role: 'user', parts: [{ type: 'text', text: 'Are you available?' }] };

const show = (messages: Message[], status: Status, onRetry = vi.fn(), failure?: Failure) => {
  render(
    <Conversation
      messages={messages}
      status={status}
      failure={failure}
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

  it('tells the visitor it is an AI that can be wrong, and that nothing is kept', () => {
    show([question], 'submitted');
    expect(screen.getByText('AI version of Lény · can be wrong')).toBeInTheDocument();
    expect(screen.getByText(/This site does not keep your conversations\./)).toBeInTheDocument();
  });

  it('names the step it is on instead of thinking', () => {
    render(
      <Conversation
        messages={[question]}
        status="submitted"
        step="resume"
        avatarRef={createRef()}
        onRestart={vi.fn()}
        onRetry={vi.fn()}
        onClose={vi.fn()}
      />,
      { wrapper: InEnglish }
    );
    expect(screen.getByRole('status')).toHaveTextContent('Reading my resume…');
  });

  it('says an answer stopped before its first words, and asks it again', () => {
    const onRetry = show([question], 'ready');
    expect(screen.getByRole('status')).toHaveTextContent('Stopped.');
    expect(screen.queryByRole('link', { name: 'Email me' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('treats an unexplained failure as unavailable: try again, or reach Lény directly', () => {
    const onRetry = show([question], 'error');
    expect(screen.getByRole('status')).toHaveTextContent('I can’t answer right now.');
    expect(screen.getByRole('button', { name: 'Book a call' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', 'mailto:contact@lenysauzet.com');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('gives each refusal its own words and only the remedies that help', () => {
    show([question], 'error', vi.fn(), 'rate-limited');
    expect(screen.getByRole('status')).toHaveTextContent('Give me a minute.');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Email me' })).toBeNull();
  });

  it('offers a direct contact but no retry while the assistant is switched off', () => {
    show([question], 'error', vi.fn(), 'disabled');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Email me' })).toBeInTheDocument();
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
