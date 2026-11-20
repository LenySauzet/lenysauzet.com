import { create } from 'zustand';

import type { IslandState } from '@/app/_components/Island/types';

interface IslandStore {
  presented: IslandState[];
  present: (state: IslandState, options?: { ttl?: number }) => void;
  dismiss: (id: string) => void;
}

const expiries = new Map<string, number>();

const forget = (id: string) => {
  window.clearTimeout(expiries.get(id));
  expiries.delete(id);
};

export const useIslandStore = create<IslandStore>((set, get) => ({
  presented: [],

  present: (state, { ttl } = {}) => {
    forget(state.id);
    set({ presented: [...get().presented.filter((raised) => raised.id !== state.id), state] });
    if (ttl) expiries.set(state.id, window.setTimeout(() => get().dismiss(state.id), ttl));
  },

  dismiss: (id) => {
    forget(id);
    const presented = get().presented.filter((raised) => raised.id !== id);
    if (presented.length !== get().presented.length) set({ presented });
  },
}));
