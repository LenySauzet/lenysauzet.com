import { useIslandStore } from '@/hooks/use-island-store';

import type { IslandState } from '../types';

export const availability: IslandState = {
  id: 'availability',
  render: () => (
    <div className="flex w-full items-center justify-center gap-2.5 px-3">
      <span className="relative grid size-1.5 shrink-0 place-items-center">
        <span className="absolute size-1.5 rounded-full bg-success" />
        <span className="absolute size-1.5 animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />
      </span>
      <span className="text-sm whitespace-nowrap">Available for new projects</span>
    </div>
  ),
};

const show = () => useIslandStore.getState().present(availability);
const hide = () => useIslandStore.getState().dismiss(availability.id);

export const showsAvailability = {
  onPointerEnter: show,
  onPointerLeave: hide,
  onFocus: show,
  onBlur: hide,
};
