'use client';

import { LanguageCircleIcon } from '@hugeicons/core-free-icons';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { announce } from '@/hooks/use-island-store';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { useSwitchLanguage } from '@/hooks/use-switch-language';
import { versionToOffer } from '@/i18n/locales';

import { MENTIONS_PALETTE_AFTER, MENTIONS_PALETTE_FOR } from './Island/motion';

const OFFERED_AFTER = MENTIONS_PALETTE_AFTER + MENTIONS_PALETTE_FOR + 600;
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
  const switchLanguage = useSwitchLanguage();

  useEffect(() => {
    const other = versionToOffer(locale, navigator.languages);
    if (!other || alreadyOffered()) return;

    const offering = window.setTimeout(() => {
      if (document.visibilityState !== 'visible' || usePaletteStore.getState().isOpen) return;
      rememberOffered();
      announce(t('otherVersion'), { icon: LanguageCircleIcon, lang: other, ttl: OFFERED_FOR, action: switchLanguage });
    }, OFFERED_AFTER);
    return () => window.clearTimeout(offering);
  }, [locale, switchLanguage, t]);

  return null;
}
