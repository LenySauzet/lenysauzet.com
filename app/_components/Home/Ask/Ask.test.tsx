import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InEnglish } from '@/test/intl';

import { Ask } from './Ask';

vi.mock('motion/react', async (original) => ({
  ...(await original<typeof import('motion/react')>()),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));

const settle = (ms: number) => act(() => vi.advanceTimersByTime(ms));

const visit = () => {
  render(<Ask />, { wrapper: InEnglish });
  return screen.getByRole('textbox', { name: 'Ask Lény' });
};

describe('Ask', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('offers the hot topics while the field has focus and nothing is written', () => {
    const field = visit();
    expect(screen.queryByRole('button', { name: 'Are you available?' })).toBeNull();

    act(() => field.focus());
    expect(screen.getByRole('button', { name: 'Are you available?' })).toBeInTheDocument();

    fireEvent.change(field, { target: { value: 'Hi' } });
    settle(1000);
    expect(screen.queryByRole('button', { name: 'Are you available?' })).toBeNull();
  });

  it('asks a topic, keeps the field focused, names its step, then answers with its action and a copy', () => {
    const field = visit();
    act(() => field.focus());
    const topic = screen.getByRole('button', { name: 'Are you available?' });
    act(() => topic.focus());
    fireEvent.click(topic);
    expect(field).toHaveFocus();

    const log = screen.getByRole('log');
    expect(log).toHaveTextContent('Are you available?');
    expect(log).toHaveTextContent('Reading my resume…');
    expect(screen.getByRole('status')).toHaveTextContent('Reading my resume…');

    settle(2000);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    settle(8000);
    expect(log).toHaveTextContent('My work-study at Tolk.ai ended');
    expect(screen.getByRole('status')).toHaveTextContent('My work-study at Tolk.ai ended');
    expect(screen.getByRole('button', { name: 'Book a call' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy answer' })).toBeInTheDocument();
  });

  it('sends with Enter, breaks a line with Shift+Enter, and refuses a blank question', () => {
    const field = visit();
    fireEvent.change(field, { target: { value: '   ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.queryByRole('log')).toBeNull();

    fireEvent.change(field, { target: { value: 'What did you build?' } });
    fireEvent.keyDown(field, { key: 'Enter', shiftKey: true });
    expect(screen.queryByRole('log')).toBeNull();

    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByRole('log')).toHaveTextContent('What did you build?');
    expect(field).toHaveValue('');
  });

  it('stops an answer from the keyboard and gives the field its focus back', () => {
    const field = visit();
    act(() => field.focus());
    settle(1000);
    fireEvent.change(field, { target: { value: 'Are you available?' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    const stop = screen.getByRole('button', { name: 'Stop answering' });
    act(() => stop.focus());
    fireEvent.click(stop);
    settle(8000);
    expect(field).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Stopped.');
  });

  it('closes one layer per Escape and opens again on the conversation it left', () => {
    const field = visit();
    act(() => field.focus());
    fireEvent.change(field, { target: { value: 'Are you available?' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    settle(8000);

    fireEvent.keyDown(field, { key: 'Escape' });
    settle(1000);
    expect(screen.queryByRole('log')).toBeNull();
    expect(field).toHaveFocus();

    fireEvent.keyDown(field, { key: 'Escape' });
    expect(field).not.toHaveFocus();

    act(() => field.focus());
    expect(screen.getByRole('log')).toHaveTextContent('Are you available?');
  });

  it('gives the field back its focus when the conversation is closed from the keyboard', () => {
    const field = visit();
    fireEvent.change(field, { target: { value: 'Are you available?' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    settle(8000);

    const close = screen.getByRole('button', { name: 'Close' });
    act(() => close.focus());
    fireEvent.click(close, { detail: 0 });
    settle(1000);
    expect(screen.queryByRole('log')).toBeNull();
    expect(field).toHaveFocus();
  });

  it('starts over from the header', () => {
    const field = visit();
    fireEvent.change(field, { target: { value: 'Are you available?' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    settle(8000);

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
    settle(1000);
    expect(screen.queryByRole('log')).toBeNull();
    expect(field).toHaveFocus();
  });
});
