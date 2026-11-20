import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePaletteStore } from '@/hooks/use-palette-store';

import { PaletteLauncher } from './PaletteLauncher';

const setTheme = vi.fn();

vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'dark', setTheme }) }));
vi.mock('next/dynamic', () => ({ default: () => () => <div data-testid="palette" /> }));

const press = (key: string) =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, metaKey: true, cancelable: true }));
  });

describe('PaletteLauncher', () => {
  beforeEach(() => usePaletteStore.setState({ wanted: false, isOpen: false }));

  it('mounts nothing until the palette is wanted', () => {
    const { queryByTestId } = render(<PaletteLauncher />);
    expect(queryByTestId('palette')).not.toBeInTheDocument();

    act(() => usePaletteStore.getState().want());
    expect(queryByTestId('palette')).toBeInTheDocument();
  });

  it('opens and closes the palette on ⌘K', () => {
    render(<PaletteLauncher />);

    press('k');
    expect(usePaletteStore.getState().isOpen).toBe(true);

    press('k');
    expect(usePaletteStore.getState().isOpen).toBe(false);
  });

  it('runs a shortcut without the palette, closing it if open', () => {
    render(<PaletteLauncher />);
    press('k');

    press('d');

    expect(setTheme).toHaveBeenCalledWith('light');
    expect(usePaletteStore.getState().isOpen).toBe(false);
  });
});
