import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Video } from '@/types/content';

interface PlayerState {
  /** The one video open in the theater; only one plays at a time. */
  current: Video | null;
  open: (video: Video) => void;
  close: () => void;
}

export const usePlayer = create<PlayerState>((set) => ({
  current: null,
  open: (video) => set({ current: video }),
  close: () => set({ current: null }),
}));

interface WatchState {
  /** youtubeId → last position (s), duration (s) and whether it was watched to the end. */
  watched: Record<string, { at: number; duration: number; done: boolean }>;
  record: (id: string, at: number, duration: number, done?: boolean) => void;
}

/** Local viewing progress, used to resume and to mark watched videos. Never leaves the device. */
export const useWatched = create<WatchState>()(
  persist(
    (set) => ({
      watched: {},
      record: (id, at, duration, done) =>
        set((s) => {
          const prev = s.watched[id];
          return {
            watched: {
              ...s.watched,
              [id]: { at: done ? 0 : at, duration: duration || prev?.duration || 0, done: done || prev?.done || false },
            },
          };
        }),
    }),
    { name: 'concilium-watched', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
