import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { InEnglish } from '@/test/intl';

import { OtherVersion } from './OtherVersion';

const OFFERED = 'other-version-offered';

const offer = () => useIslandStore.getState().presented.find((presence) => presence.id === 'announcement');

const visit = (languages: string[]) => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
  render(<OtherVersion />, { wrapper: InEnglish });
  act(() => vi.advanceTimersByTime(5000));
};

describe('OtherVersion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    useIslandStore.setState({ presented: [] });
    usePaletteStore.setState({ isOpen: false });
  });

  afterEach(() => sessionStorage.clear());

  it('offers the French page once a visit, in the page language, to a reader whose first language it is', () => {
    visit(['fr-FR', 'en']);

    expect(offer()).toMatchObject({
      message: 'French version available',
      action: expect.any(Function),
    });
    expect(sessionStorage.getItem(OFFERED)).not.toBeNull();
  });

  it('stays quiet once offered this visit, for other readers, or while it could not be seen', () => {
    sessionStorage.setItem(OFFERED, '1');
    visit(['fr-FR']);
    expect(offer()).toBeUndefined();

    sessionStorage.clear();
    visit(['en-US', 'fr']);
    expect(offer()).toBeUndefined();

    usePaletteStore.setState({ isOpen: true });
    visit(['fr-FR']);
    expect(offer()).toBeUndefined();
    expect(sessionStorage.getItem(OFFERED)).toBeNull();
  });

  it('never offers when the browser refuses its storage, rather than offering on every visit', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    visit(['fr-FR']);

    expect(offer()).toBeUndefined();
  });
});
