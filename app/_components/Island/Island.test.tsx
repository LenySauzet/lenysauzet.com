import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { announce, useIslandStore } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { InEnglish } from '@/test/intl';

import { Island } from './Island';

const settle = () => act(() => vi.advanceTimersByTime(300));
const nextTask = () => act(() => new Promise((resolve) => setTimeout(resolve)));

describe('Island', () => {
  beforeEach(() => {
    useIslandStore.setState({ presented: [] });
    usePaletteStore.setState({ wanted: false, isOpen: false, returningFocus: false });
  });

  it('rests on the name, and says how to reach the commands when pointed at', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Island />, { wrapper: InEnglish });
    settle();

    const island = screen.getByRole('button', { name: 'Open the command palette' });
    expect(island).toHaveTextContent('Leny');

    await user.hover(island);
    expect(island).toHaveTextContent('Click or Ctrl+K for commands');
    expect(usePaletteStore.getState().wanted).toBe(true);
  });

  it('reads an announcement out through a live region, again when it repeats', async () => {
    render(<Island />, { wrapper: InEnglish });

    act(() => announce('Email copied'));
    await nextTask();
    expect(screen.getByRole('status')).toHaveTextContent('Email copied');

    act(() => announce('Email copied'));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await nextTask();
    expect(screen.getByRole('status')).toHaveTextContent('Email copied');
  });

  it('opens the palette on a click', async () => {
    const user = userEvent.setup();
    render(<Island />, { wrapper: InEnglish });

    await user.click(screen.getByRole('button', { name: 'Open the command palette' }));

    expect(usePaletteStore.getState().isOpen).toBe(true);
  });

  it('runs what an announcement offers on a click, in place of the palette', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    const offered = vi.fn();
    render(<Island />, { wrapper: InEnglish });
    settle();
    act(() => announce('French version available', { action: offered }));

    await user.click(screen.getByRole('button', { name: 'French version available' }));

    expect(offered).toHaveBeenCalledOnce();
    expect(usePaletteStore.getState().isOpen).toBe(false);
    expect(useIslandStore.getState().presented).toEqual([]);
  });
});
