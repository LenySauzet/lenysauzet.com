'use client';

import { LanguageCircleIcon } from '@hugeicons/core-free-icons';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { announce, useIslandStore } from '@/hooks/use-island-store';
import { useOtherVersion } from '@/hooks/use-other-version';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { versionToOffer } from '@/i18n/locales';

const OFFERED_FOR = 5000;
const OFFERED = 'other-version-offered';

const alreadyOffered = () => {
  try {
    return sessionStorage.getItem(OFFERED) !== null;
  } catch {
    return true;
  }
};

const rememberOffered = () => {
  try {
    sessionStorage.setItem(OFFERED, '1');
  } catch {}
};

const readerLanguages = () => (navigator.languages?.length ? navigator.languages : [navigator.language]);

export function OtherVersion() {
  const locale = useLocale();
  const t = useTranslations('Island');
  const goToOtherVersion = useOtherVersion();

  useEffect(() => {
    if (!versionToOffer(locale, readerLanguages()) || alreadyOffered()) return;

    const offer = () => {
      if (usePaletteStore.getState().wanted) return;
      rememberOffered();
      announce(t('otherVersion'), { icon: LanguageCircleIcon, ttl: OFFERED_FOR, action: goToOtherVersion });
    };
    const onceSeen = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onceSeen);
      offer();
    };

    let hinted = false;
    const unsubscribe = useIslandStore.subscribe(({ presented }) => {
      const hinting = presented.some((presence) => presence.id === 'hint');
      hinted ||= hinting;
      if (!hinted || hinting) return;
      unsubscribe();
      if (document.visibilityState === 'visible') offer();
      else document.addEventListener('visibilitychange', onceSeen);
    });

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onceSeen);
    };
  }, [locale, goToOtherVersion, t]);

  return null;
}
