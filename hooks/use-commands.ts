import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { otherLocale } from '@/i18n/locales';
import { usePathname, useRouter } from '@/i18n/navigation';
import { createCommands } from '@/lib/commands/registry';

export function useCommands() {
  const t = useTranslations('Commands');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return useMemo(
    () =>
      createCommands({
        t,
        locale,
        switchLanguage: () => router.replace(pathname, { locale: otherLocale(locale) }),
      }),
    [t, locale, router, pathname]
  );
}
