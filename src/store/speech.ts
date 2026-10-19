import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lang } from '@/types/content';

export type SpeechStatus = 'idle' | 'playing' | 'paused';

interface SpeechState {
  status: SpeechStatus;
  /** Block being read (0-based) and the number of blocks on the page. */
  index: number;
  total: number;
  /** Chosen voice per language (voiceURI); unset means the best male voice available. */
  voice: Partial<Record<Lang, string>>;
  rate: number;
  setVoice: (lang: Lang, uri: string | undefined) => void;
  setRate: (rate: number) => void;
}

/** Read-aloud state. Voice and speed are remembered on this device. */
export const useSpeech = create<SpeechState>()(
  persist(
    (set) => ({
      status: 'idle',
      index: 0,
      total: 0,
      voice: {},
      rate: 1,
      setVoice: (lang, uri) => set((s) => ({ voice: { ...s.voice, [lang]: uri } })),
      setRate: (rate) => set({ rate }),
    }),
    {
      name: 'concilium-voice',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ voice: s.voice, rate: s.rate }),
    },
  ),
);

export const RATES = [0.8, 0.9, 1, 1.1, 1.25, 1.5] as const;
