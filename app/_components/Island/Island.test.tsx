import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';

import { Island } from './Island';
import { availability, showsAvailability } from './states/availability';

const settle = () => act(() => vi.advanceTimersByTime(300));

describe('Island', () => {
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

  it('shows the availability while a way to reach me is pointed at, and lets it go after', () => {
    vi.useFakeTimers();
    render(<Island />);
    settle();

    act(() => showsAvailability.onPointerEnter());
    expect(screen.getByRole('button')).toHaveTextContent('Available for new projects');

    act(() => showsAvailability.onPointerLeave());
    expect(useIslandStore.getState().presented.map((state) => state.id)).not.toContain(availability.id);
    expect(screen.getByRole('button')).toHaveTextContent('Leny');
    vi.useRealTimers();
  });

  it('opens the palette on a click', async () => {
    const user = userEvent.setup();
    render(<Island />);

    await user.click(screen.getByRole('button', { name: 'Open the command palette' }));

    expect(usePaletteStore.getState().isOpen).toBe(true);
  });
});
