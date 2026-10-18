import { create } from 'zustand';

/** Reading focus mode (not persisted): hides the app chrome around the text. */
export const useFocusMode = create<{ on: boolean; set: (on: boolean) => void }>((set) => ({
  on: false,
  set: (on) => {
    document.documentElement.classList.toggle('focus-mode', on);
    set({ on });
  },
}));
