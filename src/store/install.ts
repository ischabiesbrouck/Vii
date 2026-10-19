import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  /** The browser's deferred install prompt (Chrome, Edge, Samsung Internet); null elsewhere. */
  event: BeforeInstallPromptEvent | null;
  installed: boolean;
}

export const useInstall = create<InstallState>(() => ({ event: null, installed: false }));

/** Catch the install prompt as early as possible; it fires once, often before React mounts. */
export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstall.setState({ event: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => useInstall.setState({ event: null, installed: true }));
}

/** Show the browser's own install dialog. Resolves true if the reader installed the app. */
export async function promptInstall(): Promise<boolean> {
  const e = useInstall.getState().event;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  useInstall.setState({ event: null, installed: outcome === 'accepted' });
  return outcome === 'accepted';
}

export type Platform = 'ios' | 'android' | 'desktop';

export function platform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}
