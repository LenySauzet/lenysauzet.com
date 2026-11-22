import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { announceResume, resumeRoute } from '@/lib/services/resume';

export function useResumeAnchor() {
  const locale = useLocale();
  const t = useTranslations('Commands');

  return useMemo(
    () => ({ href: resumeRoute(locale), download: true, onClick: () => announceResume(t('downloadingResume')) }),
    [locale, t]
  );
}
