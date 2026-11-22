import { Download01Icon } from '@hugeicons/core-free-icons';
import type { Locale } from 'next-intl';

import { announce } from '@/hooks/use-island-store';
import { getPathname } from '@/i18n/navigation';

export const resumeLink = (locale: Locale, downloading: string) => ({
  href: getPathname({ href: '/resume', locale }),
  download: true,
  onClick: () => announce(downloading, { icon: Download01Icon }),
});
