import Logo from '@/components/shared/Logo';
import siteConfig from '@/config/site';

import type { IslandState } from '../types';

export const identity: IslandState = {
  id: 'identity',
  width: '13.75rem',
  render: () => (
    <div className="flex h-7.5 w-full items-center justify-between pr-4 pl-2">
      <Logo className="size-5 shrink-0" />
      <span className="font-mono tracking-wider whitespace-nowrap text-muted-foreground">
        {siteConfig.author.firstName}
      </span>
    </div>
  ),
};
