import { getCalApi } from '@calcom/embed-react';
import { Calendar01Icon } from '@hugeicons/core-free-icons';

import siteConfig from '@/config/site';
import { announce } from '@/hooks/use-island-store';

export async function openBooking(theme: string | undefined, unreachable: string) {
  try {
    const cal = await getCalApi();
    cal('ui', { theme: theme === 'light' ? 'light' : 'dark' });
    cal('modal', { calLink: siteConfig.calHandle });
  } catch {
    announce(unreachable, { icon: Calendar01Icon });
  }
}
