import type { IconSvgElement } from '@hugeicons/react';
import { create } from 'zustand';

export type Presence =
  { id: 'hint' } | { id: 'announcement'; message: string; icon?: IconSvgElement; at: number; action?: () => void };

interface IslandStore {
  presented: Presence[];
  present: (presence: Presence, options?: { ttl?: number }) => void;
  dismiss: (id: Presence['id']) => void;
}

const ANNOUNCEMENT_TTL = 2600;
const expiries = new Map<Presence['id'], number>();

const forget = (id: Presence['id']) => {
  window.clearTimeout(expiries.get(id));
  expiries.delete(id);
};

export const useIslandStore = create<IslandStore>((set, get) => ({
  presented: [],

  present: (presence, { ttl } = {}) => {
    forget(presence.id);
    set({ presented: [...get().presented.filter(({ id }) => id !== presence.id), presence] });
    if (ttl)
      expiries.set(
        presence.id,
        window.setTimeout(() => get().dismiss(presence.id), ttl)
      );
  },

  dismiss: (id) => {
    forget(id);
    const presented = get().presented.filter((presence) => presence.id !== id);
    if (presented.length !== get().presented.length) set({ presented });
  },
}));

interface AnnounceOptions {
  action?: () => void;
  ttl?: number;
}

export const announce = (
  message: string,
  icon?: IconSvgElement,
  { action, ttl = ANNOUNCEMENT_TTL }: AnnounceOptions = {}
) => useIslandStore.getState().present({ id: 'announcement', message, icon, at: Date.now(), action }, { ttl });
