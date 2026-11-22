import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { goTo } from '@/lib/browser';
import { InEnglish } from '@/test/intl';

import { Island } from './Island';
import { OtherVersion } from './OtherVersion';

vi.mock('@/lib/browser', async (original) => ({
  ...(await original<typeof import('@/lib/browser')>()),
  goTo: vi.fn(),
}));

const HINT_ENDS = 3800;

const ids = () => useIslandStore.getState().presented.map((presence) => presence.id);
const offered = () => useIslandStore.getState().presented.some((presence) => presence.id === 'announcement');

const visit = (languages: string[]) => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
  return render(
    <>
      <Island />
      <OtherVersion />
    </>,
    { wrapper: InEnglish }
  );
};

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('OtherVersion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    useIslandStore.setState({ presented: [] });
    usePaletteStore.setState({ wanted: false, isOpen: false, returningFocus: false });
  });

  afterEach(() => sessionStorage.clear());

  it('takes over from the hint the moment it ends', () => {
    visit(['fr-FR', 'en']);

    wait(HINT_ENDS - 1);
    expect(ids()).toEqual(['hint']);
    wait(1);

    expect(ids()).toEqual(['announcement']);
  });

  it('goes to the French page when clicked, in place of the palette', () => {
    visit(['fr-FR']);
    wait(HINT_ENDS);

    fireEvent.click(screen.getByRole('button', { name: 'French version available' }));

    expect(goTo).toHaveBeenCalledWith('/fr');
    expect(usePaletteStore.getState().isOpen).toBe(false);
  });

  it('stays quiet for a reader who reached for the island', () => {
    visit(['fr-FR']);
    wait(2000);
    expect(ids()).toEqual(['hint']);

    fireEvent.pointerEnter(screen.getByRole('button'));
    wait(HINT_ENDS);

    expect(offered()).toBe(false);
  });

  it('stays quiet for a reader who reads the page language first', () => {
    visit(['en-US', 'fr']);
    wait(HINT_ENDS);

    expect(offered()).toBe(false);
  });

  it('waits for a tab opened in the background to be seen', () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    visit(['fr-FR']);
    wait(HINT_ENDS);
    expect(offered()).toBe(false);

    visibility.mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(offered()).toBe(true);
  });

  it('offers once a visit', () => {
    visit(['fr-FR']);
    wait(HINT_ENDS);
    expect(offered()).toBe(true);

    useIslandStore.setState({ presented: [] });
    visit(['fr-FR']);
    wait(HINT_ENDS);
    expect(offered()).toBe(false);
  });

  it('never offers when the browser refuses its storage, rather than on every load', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    visit(['fr-FR']);
    wait(HINT_ENDS);

    expect(offered()).toBe(false);
  });
});
