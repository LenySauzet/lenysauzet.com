import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { inLocale } from '@/test/intl';

import { useSwitchLanguage } from './use-switch-language';

const replace = vi.fn();
let current = '/';

vi.mock('next/navigation', async (original) => ({
  ...(await original<typeof import('next/navigation')>()),
  usePathname: () => current,
  useRouter: () => ({ replace }),
}));

describe('useSwitchLanguage', () => {
  it('goes to the other language without a prefix the default one does not need', () => {
    current = '/fr';
    renderHook(useSwitchLanguage, { wrapper: inLocale('fr') }).result.current();
    expect(replace).toHaveBeenLastCalledWith('/');

    current = '/';
    renderHook(useSwitchLanguage, { wrapper: inLocale('en') }).result.current();
    expect(replace).toHaveBeenLastCalledWith('/fr');
  });
});
