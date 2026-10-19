import { create } from 'zustand';

/** Whether the welcome guide is open, and on which tab. */
export const useWelcome = create<{ open: boolean; tab: 'content' | 'tech' | 'install'; show: (tab?: 'content' | 'tech' | 'install') => void; hide: () => void }>((set) => ({
  open: false,
  tab: 'content',
  show: (tab = 'content') => set({ open: true, tab }),
  hide: () => set({ open: false }),
}));

/** Resolves once the start-up animation in index.html has gone. */
export function splashDone(): Promise<void> {
  if (!document.getElementById('splash')) return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('concilium:splash-done', () => resolve(), { once: true });
    window.setTimeout(resolve, 3000);
  });
}
