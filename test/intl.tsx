import { createTranslator, NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { createCommands } from '@/lib/commands/registry';
import en from '@/messages/en.json';

export const englishCommands = (goToOtherVersion = vi.fn()) =>
  createCommands({
    t: createTranslator({ locale: 'en', messages: en, namespace: 'Commands' }),
    locale: 'en',
    goToOtherVersion,
  });

export function InEnglish({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {children}
    </NextIntlClientProvider>
  );
}
