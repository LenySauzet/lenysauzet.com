import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PresenceStore {
  hidden: boolean;
  toggle: () => boolean;
}

export const usePresenceStore = create<PresenceStore>()(
  persist(
    (set, get) => ({
      hidden: false,
      toggle: () => {
        const hidden = !get().hidden;
        set({ hidden });
        return hidden;
      },
    }),
    { name: 'presence' }
  )
);
