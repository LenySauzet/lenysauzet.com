import { Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Logo } from '@/components/shared/Logo';
import siteConfig from '@/config/site';
import type { Presence } from '@/hooks/use-island-store';
import { modifierLabel, platformOf } from '@/lib/commands/keys';

export type Shown = Presence | { id: 'identity' } | { id: 'resting' };

function Hint() {
  const t = useTranslations('Island');

  return (
    <span className="w-full px-3 text-center font-mono text-xs leading-none whitespace-nowrap text-subtle-foreground">
      <span className="pointer-coarse:hidden">
        {t('hint', { modifier: modifierLabel(platformOf(navigator.userAgent)) })}
      </span>
      <span className="pointer-fine:hidden">{t('tap')}</span>
    </span>
  );
}

interface View {
  key: string | number;
  width?: string;
  content: ReactNode;
}

export function viewOf(shown: Shown): View {
  switch (shown.id) {
    case 'resting':
      return { key: shown.id, content: <div className="w-20" /> };
    case 'identity':
      return {
        key: shown.id,
        width: '13.75rem',
        content: (
          <div className="flex h-7.5 w-full items-center justify-between pr-4 pl-2">
            <Logo className="size-5 shrink-0" />
            <span className="font-mono tracking-wider whitespace-nowrap text-muted-foreground">
              {siteConfig.author.firstName}
            </span>
          </div>
        ),
      };
    case 'hint':
      return {
        key: shown.id,
        content: <Hint />,
      };
    case 'announcement':
      return {
        key: shown.at,
        content: (
          <div className="flex w-full items-center justify-center gap-2 px-3">
            <HugeiconsIcon icon={shown.icon ?? Tick02Icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
            <span lang={shown.lang} className="truncate text-sm">
              {shown.message}
            </span>
          </div>
        ),
      };
  }
}
