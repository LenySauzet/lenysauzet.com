import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePaletteStore } from '@/hooks/use-palette-store';
import { InEnglish } from '@/test/intl';

import { PaletteLauncher } from './PaletteLauncher';

const setTheme = vi.fn();

vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'dark', setTheme }) }));
vi.mock('next/dynamic', () => ({ default: () => () => <div data-testid="palette" /> }));

const press = (key: string, init: KeyboardEventInit = {}) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key, code: `Key${key.toUpperCase()}`, ctrlKey: true, cancelable: true, ...init })
    );
  });

describe('PaletteLauncher', () => {
  beforeEach(() => {
    setTheme.mockClear();
    usePaletteStore.setState({ wanted: false, isOpen: false });
  });

  it('mounts nothing until the palette is wanted', () => {
    const { queryByTestId } = render(<PaletteLauncher />, { wrapper: InEnglish });
    expect(queryByTestId('palette')).not.toBeInTheDocument();

    act(() => usePaletteStore.getState().want());
    expect(queryByTestId('palette')).toBeInTheDocument();
  });

  it('opens and closes the palette on the modifier and K', () => {
    render(<PaletteLauncher />, { wrapper: InEnglish });

    press('k');
    expect(usePaletteStore.getState().isOpen).toBe(true);

    press('k');
    expect(usePaletteStore.getState().isOpen).toBe(false);
  });

  it('runs a shortcut without loading the palette', () => {
    render(<PaletteLauncher />, { wrapper: InEnglish });

    press('d');

    expect(setTheme).toHaveBeenCalledWith('light');
    expect(usePaletteStore.getState().wanted).toBe(false);
  });

  it('lets a held key or another modifier through untouched', () => {
    render(<PaletteLauncher />, { wrapper: InEnglish });

    press('d', { repeat: true });
    press('d', { shiftKey: true });

    expect(setTheme).not.toHaveBeenCalled();
  });
});
