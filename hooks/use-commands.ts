'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { createCommands } from '@/lib/commands/registry';

import { useOtherVersion } from './use-other-version';

export function useCommands() {
  const t = useTranslations('Commands');
  const locale = useLocale();
  const goToOtherVersion = useOtherVersion();

  return useMemo(() => createCommands({ t, locale, goToOtherVersion }), [t, locale, goToOtherVersion]);
}
