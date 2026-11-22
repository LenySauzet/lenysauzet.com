import type { IconSvgElement } from '@hugeicons/react';
import { create } from 'zustand';

interface Announcement {
  id: 'announcement';
  message: string;
  at: number;
  icon?: IconSvgElement;
  action?: () => void;
}

export type Presence = { id: 'hint' } | Announcement;

interface IslandStore {
  presented: Presence[];
  present: (presence: Presence, options?: { ttl?: number }) => void;
  dismiss: (id: Presence['id']) => void;
  hold: (id: Presence['id']) => void;
  release: (id: Presence['id']) => void;
}

const ANNOUNCEMENT_TTL = 2600;
const lifetimes = new Map<Presence['id'], number>();
const expiries = new Map<Presence['id'], number>();

const stop = (id: Presence['id']) => {
  window.clearTimeout(expiries.get(id));
  expiries.delete(id);
};

const forget = (id: Presence['id']) => {
  stop(id);
  lifetimes.delete(id);
};

export const useIslandStore = create<IslandStore>((set, get) => ({
  presented: [],

  present: (presence, { ttl } = {}) => {
    forget(presence.id);
    set({ presented: [...get().presented.filter(({ id }) => id !== presence.id), presence] });
    if (!ttl) return;
    lifetimes.set(presence.id, ttl);
    get().release(presence.id);
  },

  dismiss: (id) => {
    forget(id);
    const presented = get().presented.filter((presence) => presence.id !== id);
    if (presented.length !== get().presented.length) set({ presented });
  },

  hold: stop,

  release: (id) => {
    const ttl = lifetimes.get(id);
    if (ttl === undefined || expiries.has(id)) return;
    expiries.set(id, window.setTimeout(() => get().dismiss(id), ttl));
  },
}));

interface AnnounceOptions extends Pick<Announcement, 'icon' | 'action'> {
  ttl?: number;
}

export const announce = (message: string, { ttl = ANNOUNCEMENT_TTL, ...rest }: AnnounceOptions = {}) =>
  useIslandStore.getState().present({ id: 'announcement', message, at: Date.now(), ...rest }, { ttl });
