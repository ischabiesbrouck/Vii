import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lang } from '@/types/content';

export type Theme = 'system' | 'light' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg';

export interface Progress {
  /** Furthest scroll fraction reached, 0..1. */
  fraction: number;
  lastParagraphId: string | null;
  updatedAt: number;
}

interface UiState {
  lang: Lang;
  theme: Theme;
  fontSize: FontSize;
  progress: Record<string, Progress>;
  bookmarks: string[];
  installDismissed: boolean;
  /** The welcome guide has been seen (it opens by itself only on the first visit). */
  welcomeSeen: boolean;
  /** Subject id → paragraph ids marked as studied. */
  studied: Record<string, string[]>;
  /** Lesson id → completion and best knowledge-check score. */
  lessons: Record<string, { done: boolean; score: number | null; updatedAt: number }>;
  /** Subject id → study-text chapters read (1-based). */
  studyRead: Record<string, number[]>;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  recordProgress: (docId: string, fraction: number, lastParagraphId: string | null) => void;
  toggleBookmark: (paragraphId: string) => void;
  dismissInstall: () => void;
  setWelcomeSeen: () => void;
  toggleStudied: (subjectId: string, paragraphId: string) => void;
  setLesson: (id: string, patch: { done?: boolean; score?: number }) => void;
  markChapterRead: (subjectId: string, chapter: number) => void;
}

/**
 * UI state. Persisted to localStorage (key 'concilium-ui'): language, theme,
 * reading progress and bookmarks never leave the device.
 */
export const useUi = create<UiState>()(
  persist(
    (set) => ({
      lang: 'nl',
      theme: 'system',
      fontSize: 'md',
      progress: {},
      bookmarks: [],
      installDismissed: false,
      welcomeSeen: false,
      studied: {},
      lessons: {},
      studyRead: {},
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      recordProgress: (docId, fraction, lastParagraphId) =>
        set((s) => {
          const prev = s.progress[docId];
          return {
            progress: {
              ...s.progress,
              [docId]: {
                fraction: Math.max(prev?.fraction ?? 0, Math.min(1, fraction)),
                lastParagraphId: lastParagraphId ?? prev?.lastParagraphId ?? null,
                updatedAt: Date.now(),
              },
            },
          };
        }),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id],
        })),
      dismissInstall: () => set({ installDismissed: true }),
      setWelcomeSeen: () => set({ welcomeSeen: true }),
      setLesson: (id, patch) =>
        set((s) => {
          const prev = s.lessons[id] ?? { done: false, score: null, updatedAt: 0 };
          return {
            lessons: {
              ...s.lessons,
              [id]: {
                done: patch.done ?? prev.done,
                score: patch.score === undefined ? prev.score : Math.max(prev.score ?? 0, patch.score),
                updatedAt: Date.now(),
              },
            },
          };
        }),
      markChapterRead: (subjectId, chapter) =>
        set((s) => {
          const cur = s.studyRead[subjectId] ?? [];
          return cur.includes(chapter) ? s : { studyRead: { ...s.studyRead, [subjectId]: [...cur, chapter].sort((a, b) => a - b) } };
        }),
      toggleStudied: (subjectId, paragraphId) =>
        set((s) => {
          const cur = s.studied[subjectId] ?? [];
          const next = cur.includes(paragraphId) ? cur.filter((x) => x !== paragraphId) : [...cur, paragraphId];
          return { studied: { ...s.studied, [subjectId]: next } };
        }),
    }),
    {
      name: 'concilium-ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
