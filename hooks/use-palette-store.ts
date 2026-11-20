import { create } from 'zustand';

interface PaletteStore {
  wanted: boolean;
  isOpen: boolean;
  returningFocus: boolean;
  want: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const usePaletteStore = create<PaletteStore>((set) => ({
  wanted: false,
  isOpen: false,
  returningFocus: false,
  want: () => set({ wanted: true }),
  setIsOpen: (isOpen) => set(isOpen ? { isOpen, wanted: true } : { isOpen }),
}));
