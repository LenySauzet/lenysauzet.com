'use client';

import { LanguageCircleIcon } from '@hugeicons/core-free-icons';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { announce } from '@/hooks/use-island-store';
import { usePathname, useRouter } from '@/i18n/navigation';
import { versionToOffer } from '@/i18n/locales';

const OFFERED_AFTER = 4400;
const OFFERED_FOR = 5000;
const OFFERED = 'other-version-offered';

const alreadyOffered = () => {
  try {
    return localStorage.getItem(OFFERED) !== null;
  } catch {
    return true;
  }
};

const rememberOffered = () => {
  try {
    localStorage.setItem(OFFERED, '1');
  } catch {}
};

export function OtherVersion() {
  const locale = useLocale();
  const t = useTranslations('Island');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const other = versionToOffer(locale, navigator.languages);
    if (!other || alreadyOffered()) return;

    const offering = window.setTimeout(() => {
      rememberOffered();
      announce(t('otherVersion'), LanguageCircleIcon, {
        ttl: OFFERED_FOR,
        action: () => router.replace(pathname, { locale: other }),
      });
    }, OFFERED_AFTER);
    return () => window.clearTimeout(offering);
  }, [locale, pathname, router, t]);

  return null;
}
