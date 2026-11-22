'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { createCommands } from '@/lib/commands/registry';

import { useSwitchLanguage } from './use-switch-language';

export function useCommands() {
  const t = useTranslations('Commands');
  const locale = useLocale();
  const switchLanguage = useSwitchLanguage();

  return useMemo(() => createCommands({ t, locale, switchLanguage }), [t, locale, switchLanguage]);
}
