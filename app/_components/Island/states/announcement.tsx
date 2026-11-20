import { Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

import { useIslandStore } from '@/hooks/use-island-store';

import type { IslandState } from '../types';

const DWELL = 2600;

export function announce(message: string, icon: IconSvgElement = Tick02Icon) {
  const state: IslandState = {
    id: 'announcement',
    message,
    render: () => (
      <div className="flex w-full items-center justify-center gap-2 px-3">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
        <span className="truncate text-sm">{message}</span>
      </div>
    ),
  };

  useIslandStore.getState().present(state, { ttl: DWELL });
}
