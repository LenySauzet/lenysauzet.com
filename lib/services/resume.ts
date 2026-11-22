import { Download01Icon } from '@hugeicons/core-free-icons';

import { announce } from '@/hooks/use-island-store';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export const resumeRoute = (locale: Locale) => getPathname({ href: '/resume', locale });

export const announceResume = (message: string) => announce(message, { icon: Download01Icon });
