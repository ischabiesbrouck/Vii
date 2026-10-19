// Shared helpers for the Wikimedia Commons image pipeline (runs on GitHub Actions).
export const API = 'https://commons.wikimedia.org/w/api.php';
export const UA = 'ConciliumStudyApp/1.0 (https://github.com/ischabiesbrouck/Vii; study edition of Vatican II)';

/** Free licences only: public domain, CC0, CC BY and CC BY-SA. NC and ND are rejected. */
export function isFree(license) {
  const l = (license ?? '').toLowerCase();
  if (/\bnc\b|non-?commercial|\bnd\b|no ?deriv/.test(l)) return false;
  return /public domain|^pd\b|pd-|cc0|cc[- ]by(-sa)?[- ]\d/.test(l);
}

export const strip = (html) =>
  (html ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

export async function download(url, path) {
  const { writeFile } = await import('node:fs/promises');
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  await writeFile(path, Buffer.from(await r.arrayBuffer()));
}

export function meta(page) {
  const ii = page.imageinfo?.[0];
  const m = ii?.extmetadata ?? {};
  return {
    title: page.title,
    license: strip(m.LicenseShortName?.value),
    licenseUrl: m.LicenseUrl?.value ?? '',
    author: strip(m.Artist?.value) || strip(m.Credit?.value) || 'Unknown',
    date: strip(m.DateTimeOriginal?.value),
    description: strip(m.ImageDescription?.value).slice(0, 300),
    sourceUrl: ii?.descriptionurl ?? '',
    mime: ii?.mime,
    width: ii?.thumbwidth ?? ii?.width,
    height: ii?.thumbheight ?? ii?.height,
    thumb: ii?.thumburl,
  };
}
