import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InEnglish } from '@/test/intl';

import { Composer } from './Composer';

vi.mock('motion/react', async (original) => ({
  ...(await original<typeof import('motion/react')>()),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));

class FakeRecognition {
  static last: FakeRecognition | undefined;
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: { 0: { transcript: string }; isFinal: boolean }[] }) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
  hear(transcript: string) {
    act(() => this.onresult?.({ results: [{ 0: { transcript }, isFinal: true }] }));
  }
}

function Field({
  onSend = vi.fn(),
  onStop = vi.fn(),
  busy = false,
}: {
  onSend?: () => void;
  onStop?: () => void;
  busy?: boolean;
}) {
  const [draft, setDraft] = useState('');
  return (
    <Composer
      inputRef={createRef()}
      draft={draft}
      onDraft={setDraft}
      onSend={() => {
        onSend();
        setDraft('');
      }}
      onStop={onStop}
      busy={busy}
      lit
      written
      framed={false}
      width={480}
      writeDelay={0}
      onFocus={vi.fn()}
      onPointerDown={vi.fn()}
    />
  );
}

const field = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Ask Lény' });

describe('Composer dictation', () => {
  beforeEach(() => vi.stubGlobal('SpeechRecognition', FakeRecognition));
  afterEach(() => vi.unstubAllGlobals());

  it('keeps what was heard once when the visitor stops dictating', () => {
    render(<Field />, { wrapper: InEnglish });
    fireEvent.change(field(), { target: { value: 'I wonder' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dictate' }));
    FakeRecognition.last!.hear('are you available');

    fireEvent.click(screen.getByRole('button', { name: 'Stop dictating' }));
    FakeRecognition.last!.hear('are you available');

    expect(field().value).toBe('I wonder are you available');
  });

  it('stops listening on send, so nothing heard afterwards refills the field', () => {
    const onSend = vi.fn();
    render(<Field onSend={onSend} />, { wrapper: InEnglish });
    fireEvent.click(screen.getByRole('button', { name: 'Dictate' }));
    const session = FakeRecognition.last!;
    session.hear('are you available');

    fireEvent.keyDown(field(), { key: 'Enter' });
    session.hear('are you available');

    expect(onSend).toHaveBeenCalledOnce();
    expect(session.abort).toHaveBeenCalled();
    expect(field().value).toBe('');
  });
});

describe('Composer while an answer is on its way', () => {
  it('turns send into stop, and stops the answer without sending', () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    render(<Field onSend={onSend} onStop={onStop} busy />, { wrapper: InEnglish });

    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Stop answering' }));
    expect(onStop).toHaveBeenCalledOnce();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('ignores the second click of a double click, which lands on stop just after sending', () => {
    const onStop = vi.fn();
    render(<Field onStop={onStop} busy />, { wrapper: InEnglish });

    fireEvent.click(screen.getByRole('button', { name: 'Stop answering' }), { detail: 2 });
    expect(onStop).not.toHaveBeenCalled();
  });
});
