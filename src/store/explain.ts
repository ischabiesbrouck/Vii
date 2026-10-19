import { create } from 'zustand';

/** The paragraph whose explanation panel is open, from anywhere in the app. */
export const useExplain = create<{ id: string | null; open: (id: string) => void; close: () => void }>((set) => ({
  id: null,
  open: (id) => set({ id }),
  close: () => set({ id: null }),
}));
