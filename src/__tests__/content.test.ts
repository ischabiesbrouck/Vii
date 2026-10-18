import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resources } from '@/i18n/resources';

const root = join(__dirname, '..', '..', 'public', 'content');
const read = (f: string) => JSON.parse(readFileSync(join(root, f), 'utf8'));

const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe('i18n', () => {
  it('has the same keys in Dutch and English', () => {
    expect(keys(resources.en.translation).sort()).toEqual(keys(resources.nl.translation).sort());
  });
});

describe('content', () => {
  it('ships all 16 documents with a content file each', () => {
    const docs = read('documents.json') as { id: string }[];
    const files = new Set(readdirSync(root));
    expect(docs).toHaveLength(16);
    for (const d of docs) expect(files.has(`${d.id}.json`)).toBe(true);
  });

  it('uses valid YouTube ids and vatican.va catechesis links', () => {
    for (const v of read('videos.json').items) expect(v.youtubeId).toMatch(/^[\w-]{11}$/);
    for (const c of read('catecheses.json').items) expect(c.url).toMatch(/^https:\/\/www\.vatican\.va\//);
  });

  it('keeps every knowledge-check answer in range', () => {
    for (const l of read('lessons.json')) for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length);
  });
});
