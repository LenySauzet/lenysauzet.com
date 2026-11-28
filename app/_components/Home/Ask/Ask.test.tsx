import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { askResponse, pendingResponse } from '@/test/ask';
import { InEnglish } from '@/test/intl';

import { Ask } from './Ask';

vi.mock('motion/react', async (original) => ({
  ...(await original<typeof import('motion/react')>()),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));

const AVAILABLE = 'Yes. My work-study at Tolk.ai ended in September 2026.';

const settle = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const visit = () => {
  render(<Ask />, { wrapper: InEnglish });
  return screen.getByRole('textbox', { name: 'Ask Lény' });
};

const ask = async (field: HTMLElement, question: string) => {
  fireEvent.change(field, { target: { value: question } });
  fireEvent.keyDown(field, { key: 'Enter' });
  await settle(100);
};

describe('Ask', () => {
  const api = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    api.mockReset();
    api.mockImplementation(async () =>
      askResponse({
        words: AVAILABLE.split(/(?<= )/),
        sources: [{ sourceId: 'profile', url: '/resume', title: 'Resume' }],
        action: 'book',
      })
    );
    vi.stubGlobal('fetch', api);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('offers the hot topics while the field has focus and nothing is written', async () => {
    const field = visit();
    expect(screen.queryByRole('button', { name: 'Are you available?' })).toBeNull();

    act(() => field.focus());
    expect(screen.getByRole('button', { name: 'Are you available?' })).toBeInTheDocument();

    fireEvent.change(field, { target: { value: 'Hi' } });
    await settle(1000);
    expect(screen.queryByRole('button', { name: 'Are you available?' })).toBeNull();
  });

  it('asks a topic of /api/ask, keeps the field focused, then answers with its sources, action and a copy', async () => {
    const field = visit();
    act(() => field.focus());
    const topic = screen.getByRole('button', { name: 'Are you available?' });
    act(() => topic.focus());
    fireEvent.click(topic);
    expect(field).toHaveFocus();
    await settle(1000);
    expect(screen.getByRole('log')).toHaveTextContent('Are you available?');
    const [url, init] = api.mock.calls[0]!;
    expect(url).toBe('/api/ask');
    expect(JSON.parse(String(init?.body))).toMatchObject({ surface: 'portfolio', locale: 'en' });
    expect(screen.getByRole('log')).toHaveTextContent(AVAILABLE);
    expect(screen.getByRole('status')).toHaveTextContent(AVAILABLE);
    expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/resume');
    expect(screen.getByRole('button', { name: 'Book a call' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy answer' })).toBeInTheDocument();
  });

  it('names the step the server is on while it thinks', async () => {
    api.mockImplementation(async (_, init) => pendingResponse('projects', init?.signal));
    const field = visit();
    await ask(field, 'What have you built?');
    expect(screen.getByRole('status')).toHaveTextContent('Reading my projects…');
  });

  it('says why it cannot answer when the server refuses', async () => {
    api.mockImplementation(async () => Response.json({ code: 'rate-limited' }, { status: 429 }));
    const field = visit();
    await ask(field, 'Are you available?');
    expect(screen.getByRole('status')).toHaveTextContent('Give me a minute.');
  });

  it('sends with Enter, breaks a line with Shift+Enter, and refuses a blank question', async () => {
    const field = visit();
    fireEvent.change(field, { target: { value: '   ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.queryByRole('log')).toBeNull();

    fireEvent.change(field, { target: { value: 'What did you build?' } });
    fireEvent.keyDown(field, { key: 'Enter', shiftKey: true });
    expect(screen.queryByRole('log')).toBeNull();

    fireEvent.keyDown(field, { key: 'Enter' });
    expect(field).toHaveValue('');
    await settle(1000);
    expect(screen.getByRole('log')).toHaveTextContent('What did you build?');
  });

  it('stops an answer from the keyboard and gives the field its focus back', async () => {
    api.mockImplementation(async (_, init) => pendingResponse('resume', init?.signal));
    const field = visit();
    act(() => field.focus());
    await settle(1000);
    await ask(field, 'Are you available?');

    const stop = screen.getByRole('button', { name: 'Stop answering' });
    act(() => stop.focus());
    fireEvent.click(stop);
    await settle(1000);
    expect(field).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Stopped.');
  });

  it('closes one layer per Escape and opens again on the conversation it left', async () => {
    const field = visit();
    act(() => field.focus());
    await ask(field, 'Are you available?');
    await settle(1000);

    fireEvent.keyDown(field, { key: 'Escape' });
    await settle(1000);
    expect(screen.queryByRole('log')).toBeNull();
    expect(field).toHaveFocus();

    fireEvent.keyDown(field, { key: 'Escape' });
    expect(field).not.toHaveFocus();

    act(() => field.focus());
    expect(screen.getByRole('log')).toHaveTextContent('Are you available?');
  });

  it('gives the field back its focus when the conversation is closed from the keyboard', async () => {
    const field = visit();
    await ask(field, 'Are you available?');
    await settle(1000);

    const close = screen.getByRole('button', { name: 'Close' });
    act(() => close.focus());
    fireEvent.click(close, { detail: 0 });
    await settle(1000);
    expect(screen.queryByRole('log')).toBeNull();
    expect(field).toHaveFocus();
  });

  it('starts over from the header', async () => {
    const field = visit();
    await ask(field, 'Are you available?');
    await settle(1000);

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
    await settle(1000);
    expect(screen.queryByRole('log')).toBeNull();
    expect(field).toHaveFocus();
  });
});
