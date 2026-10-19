import type { Study, StudyChapter } from '@/types/content';

const blockWords = (ch: StudyChapter, lang: 'nl' | 'en') =>
  ch.sections
    .flatMap((s) => s.blocks)
    .map((b) => {
      if (b.type === 'p' || b.type === 'box') return lang === 'nl' ? b.nl : b.en;
      if (b.type === 'list') return (lang === 'nl' ? b.nl : b.en).join(' ');
      if (b.type === 'positions') return b.positions.map((p) => (lang === 'nl' ? p.nl : p.en)).join(' ');
      return '';
    })
    .join(' ')
    .split(/\s+/).length;

/** Minutes at a steady study pace (~180 words per minute, plus quotations). */
export const readingMinutes = (study: Study, lang: 'nl' | 'en') => Math.max(1, Math.round(study.chapters.reduce((n, c) => n + blockWords(c, lang), 0) / 180));

