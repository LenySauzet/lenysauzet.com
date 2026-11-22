import type { IconSvgElement } from '@hugeicons/react';
import { create } from 'zustand';

interface Announcement {
  id: 'announcement';
  message: string;
  at: number;
  icon?: IconSvgElement;
  lang?: string;
  action?: () => void;
}

export type Presence = { id: 'hint' } | Announcement;

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
    if (ttl) expiries.set(presence.id, window.setTimeout(() => get().dismiss(presence.id), ttl));
  },

  dismiss: (id) => {
    forget(id);
    const presented = get().presented.filter((presence) => presence.id !== id);
    if (presented.length !== get().presented.length) set({ presented });
  },
}));

interface AnnounceOptions extends Pick<Announcement, 'icon' | 'lang' | 'action'> {
  ttl?: number;
}

export const announce = (message: string, { ttl = ANNOUNCEMENT_TTL, ...rest }: AnnounceOptions = {}) =>
  useIslandStore.getState().present({ id: 'announcement', message, at: Date.now(), ...rest }, { ttl });
