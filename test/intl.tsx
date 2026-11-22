import { createTranslator, NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import type { Locale } from '@/i18n/routing';
import { createCommands } from '@/lib/commands/registry';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';

const MESSAGES = { en, fr };

export const englishCommands = (switchLanguage = vi.fn()) =>
  createCommands({
    t: createTranslator({ locale: 'en', messages: en, namespace: 'Commands' }),
    locale: 'en',
    switchLanguage,
  });

export const inLocale = (locale: Locale) =>
  function InLocale({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
        {children}
      </NextIntlClientProvider>
    );
  };

export const InEnglish = inLocale('en');
