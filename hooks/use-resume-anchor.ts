'use client';

import { useLocale, useTranslations } from 'next-intl';

import { resumeLink } from '@/lib/services/resume';

export function useResumeAnchor() {
  return resumeLink(useLocale(), useTranslations('Commands')('downloadingResume'));
}
