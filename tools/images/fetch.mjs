// Phase 2: fetch the selected files at 1200 px, re-check the licence, write public/content/images.json.
// Images already in images.json (with their file present) are kept as they are, so local
// corrections (reduced size, author names) survive; only new ids are fetched and appended.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { api, download, isFree, meta } from './commons.mjs';

const root = new URL('../../', import.meta.url);
const selection = JSON.parse(await readFile(new URL('./selection.json', import.meta.url), 'utf8'));
await mkdir(new URL('public/images/', root), { recursive: true });
const existing = JSON.parse(await readFile(new URL('public/content/images.json', root), 'utf8').catch(() => '[]'));
const present = async (file) => access(new URL(`public/images/${file}`, root)).then(() => true, () => false);
const images = [];
for (const s of selection) {
  const old = existing.find((x) => x.id === s.id);
  if (old && (await present(old.file))) {
    images.push(old);
    continue;
  }
  const data = await api({ action: 'query', titles: s.title, prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '1200' });
  const page = data.query?.pages?.[0];
  const m = page && meta(page);
  if (!m?.thumb) throw new Error(`not found: ${s.title}`);
  if (!isFree(m.license)) throw new Error(`not freely licensed: ${s.title} (${m.license})`);
  const file = `${s.id}.jpg`;
  await download(m.thumb, new URL(`public/images/${file}`, root));
  images.push({
    id: s.id,
    file,
    width: m.width,
    height: m.height,
    altNl: s.altNl,
    altEn: s.altEn,
    author: s.author ?? m.author,
    license: m.license,
    ...(m.licenseUrl ? { licenseUrl: m.licenseUrl } : {}),
    sourceUrl: m.sourceUrl,
  });
  console.log(`${s.id}: ${m.license} · ${m.author}`);
}
await writeFile(new URL('public/content/images.json', root), JSON.stringify(images, null, 2) + '\n');
