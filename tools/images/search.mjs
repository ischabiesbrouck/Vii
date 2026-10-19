// Phase 1: search Commons for each query, keep freely licensed images only, save 480 px previews.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { api, download, isFree, meta } from './commons.mjs';

const dir = new URL('./candidates/', import.meta.url);
const queries = JSON.parse(await readFile(new URL('./queries.json', import.meta.url), 'utf8'));
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });
const out = [];
for (const q of queries) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${q.query} filetype:bitmap`,
    gsrlimit: String(q.limit ?? 8),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '480',
  });
  const pages = (data.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  let n = 0;
  for (const p of pages) {
    const m = meta(p);
    if (!isFree(m.license) || !/jpeg|png/.test(m.mime ?? '') || !m.thumb) continue;
    n++;
    const file = `${q.key}-${n}.jpg`;
    await download(m.thumb, new URL(file, dir));
    out.push({ key: q.key, file, ...m });
  }
  console.log(`${q.key}: ${n} free images`);
}
await writeFile(new URL('candidates.json', dir), JSON.stringify(out, null, 2) + '\n');
