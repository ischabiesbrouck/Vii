import { useEffect, useState } from 'react';
import { useUi } from '@/store/ui';
import type { Lang } from '@/types/content';

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function useLang(): Lang {
  return useUi((s) => s.lang);
}

/** Applies light/dark class to <html>, following the OS when theme === 'system'. */
export function useThemeEffect() {
  const theme = useUi((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      // An explicit data-theme on <html> (set by an embedding host) overrides the OS preference.
      const host = document.documentElement.dataset.theme;
      const systemDark = host === 'dark' || (host !== 'light' && mq.matches);
      const dark = theme === 'dark' || (theme === 'system' && systemDark);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121212' : '#7A1F1F');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Concilium` : 'Concilium — Vaticanum II in context';
  }, [title]);
}
