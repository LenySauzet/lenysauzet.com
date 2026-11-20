import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';

import { Island } from './Island';
import { announce } from './states/announcement';

const settle = () => act(() => vi.advanceTimersByTime(300));

describe('Island', () => {
  beforeEach(() => {
    useIslandStore.setState({ presented: [] });
    usePaletteStore.setState({ wanted: false, isOpen: false, returningFocus: false });
  });

  it('rests on the name, and says how to reach the commands when pointed at', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Island />);
    settle();

    const island = screen.getByRole('button', { name: 'Open the command palette' });
    expect(island).toHaveTextContent('Leny');

    await user.hover(island);
    expect(island).toHaveTextContent('Click or ⌘K for commands');
    expect(usePaletteStore.getState().wanted).toBe(true);
    vi.useRealTimers();
  });



  it('reads an announcement out through a live region', () => {
    render(<Island />);

    act(() => announce('Email copied'));

    expect(screen.getByRole('status')).toHaveTextContent('Email copied');
  });

  it('opens the palette on a click', async () => {
    const user = userEvent.setup();
    render(<Island />);

    await user.click(screen.getByRole('button', { name: 'Open the command palette' }));

    expect(usePaletteStore.getState().isOpen).toBe(true);
  });
});
