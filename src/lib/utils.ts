import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick the Dutch or English variant of a bilingual pair. */
export function pick<T>(lang: 'nl' | 'en', nl: T, en: T | undefined): T {
  return lang === 'en' && en !== undefined ? en : nl;
}

export function formatDate(iso: string, lang: 'nl' | 'en') {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
