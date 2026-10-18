#!/usr/bin/env node
/**
 * Content fidelity gate. Runs before every build and dev start.
 *
 * - Verifies every citation (claim evidence, cross-refs, glossary, hermeneutics,
 *   keyParagraphs) resolves to a seeded paragraph or a registered external source.
 * - Enforces editorial limits (summary ≤ 80 words, contested claims need positions).
 * - Writes public/content/index.json: the list of available document files and a
 *   content hash used to invalidate the cached search index.
 *
 * To add a document's content: drop public/content/{docId}.json in place. No code change.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'content');
const read = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

const documents = read('documents.json');
const sources = read('sources.json');
const claims = read('claims.json');
const timeline = read('timeline.json');
const glossary = read('glossary.json');
const hermeneutics = read('hermeneutics.json');
const subjects = read('subjects.json');
const lessons = read('lessons.json');
const catecheses = read('catecheses.json');
const videos = read('videos.json');

const hash = createHash('sha256');
for (const f of ['documents.json', 'sources.json', 'claims.json', 'timeline.json', 'glossary.json', 'hermeneutics.json', 'subjects.json', 'lessons.json', 'catecheses.json', 'videos.json']) {
  hash.update(readFileSync(join(root, f)));
}

// --- documents ------------------------------------------------------------
if (documents.length !== 16) err(`documents.json: expected 16 documents, found ${documents.length}`);
const docIds = new Set();
const abbrs = new Map();
const words = (s) => s.trim().split(/\s+/).length;
for (const d of documents) {
  if (docIds.has(d.id)) err(`duplicate document id ${d.id}`);
  docIds.add(d.id);
  abbrs.set(d.abbr, d.id);
  for (const k of ['summaryNl', 'summaryEn']) {
    if (words(d[k]) > 80) err(`${d.abbr}.${k}: ${words(d[k])} words (max 80)`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.promulgated)) err(`${d.abbr}: bad date ${d.promulgated}`);
  if (!d.officialUrl.startsWith('https://www.vatican.va/')) err(`${d.abbr}: officialUrl must be vatican.va`);
  let next = 1;
  for (const o of d.outline ?? []) {
    if (o.from !== next || o.to < o.from || o.to > d.paragraphCount) err(`${d.abbr}: outline section ${o.labelLa} (${o.from}–${o.to}) is not contiguous`);
    next = o.to + 1;
  }
  if (d.outline && next !== d.paragraphCount + 1) err(`${d.abbr}: outline does not cover all ${d.paragraphCount} paragraphs`);
}

// --- paragraphs -------------------------------------------------------------
const paragraphs = new Map();
const available = [];
const counts = {};
for (const d of documents) {
  const file = `${d.id}.json`;
  if (!existsSync(join(root, file))) continue; // TODO(content): 13 documents await content files.
  available.push(d.id);
  hash.update(readFileSync(join(root, file)));
  const c = read(file);
  counts[d.id] = c.paragraphs.length;
  if (c.docId !== d.id) err(`${file}: docId mismatch`);
  if (!c.sourceNl || !c.sourceEn) err(`${file}: missing provenance (sourceNl/sourceEn)`);
  for (const p of c.paragraphs) {
    const expectId = `${d.abbr}-${p.number}`;
    if (p.id !== expectId) err(`${file}: paragraph id ${p.id} should be ${expectId}`);
    if (p.docId !== d.id) err(`${p.id}: docId mismatch`);
    if (p.number < 1 || p.number > d.paragraphCount) err(`${p.id}: number outside 1..${d.paragraphCount}`);
    if (!p.textNl?.trim() || !p.textEn?.trim()) err(`${p.id}: empty text`);
    if (paragraphs.has(p.id)) err(`duplicate paragraph ${p.id}`);
    paragraphs.set(p.id, p);
  }
}

const sourceIds = new Set(sources.map((s) => s.id));
const checkRef = (ref, where) => {
  if (ref.startsWith('ext:')) {
    if (!sourceIds.has(ref)) err(`${where}: unknown external source ${ref}`);
  } else if (!paragraphs.has(ref)) {
    err(`${where}: paragraph ${ref} is cited but not seeded`);
  }
};

for (const p of paragraphs.values()) for (const r of p.crossRefs) checkRef(r, `${p.id}.crossRefs`);
for (const d of documents) for (const k of d.keyParagraphs) checkRef(k, `${d.abbr}.keyParagraphs`);

// --- claims ---------------------------------------------------------------
const claimIds = new Set();
const verdicts = new Set(['supported', 'not-in-the-text', 'partly', 'contested']);
const heard = new Set(['progressive-reading', 'traditionalist-reading', 'secular-media']);
for (const c of claims) {
  if (claimIds.has(c.id)) err(`duplicate claim ${c.id}`);
  claimIds.add(c.id);
  if (!verdicts.has(c.verdict)) err(`${c.id}: bad verdict`);
  if (!heard.has(c.heardFrom)) err(`${c.id}: bad heardFrom`);
  if (!c.evidence.length) err(`${c.id}: no evidence`);
  for (const e of c.evidence) checkRef(e.paragraphId, `claim ${c.id}`);
  if (c.verdict === 'contested' && (!c.positions || c.positions.length < 2)) {
    err(`${c.id}: contested claims must present at least two positions side by side`);
  }
  if (!c.furtherReading.length) warnings.push(`${c.id}: no further reading`);
}
if (claims.length < 12) err(`claims.json: at least 12 claims required, found ${claims.length}`);
for (const dir of heard) {
  if (!claims.some((c) => c.heardFrom === dir)) err(`claims.json: no claim from ${dir}`);
}

// --- glossary / timeline / hermeneutics ---------------------------------------
for (const g of glossary) if (g.firstUse) checkRef(g.firstUse, `glossary "${g.term}"`);
for (const t of timeline) for (const id of t.docIds ?? []) if (!docIds.has(id)) err(`timeline ${t.date}: unknown doc ${id}`);
for (const pos of hermeneutics.positions) for (const a of pos.appealsTo) checkRef(a.paragraphId, `hermeneutics ${pos.id}`);

// --- subjects ---------------------------------------------------------------
const termKeys = new Set(glossary.map((g) => g.term));
const subjectIds = new Set();
for (const sub of subjects) {
  if (subjectIds.has(sub.id)) err(`duplicate subject ${sub.id}`);
  subjectIds.add(sub.id);
  if (sub.steps.length < 3) err(`subject ${sub.id}: at least 3 reading steps required`);
  for (const st of sub.steps) checkRef(st.paragraphId, `subject ${sub.id}`);
  for (const c of sub.claims) if (!claimIds.has(c)) err(`subject ${sub.id}: unknown claim ${c}`);
  for (const t of sub.terms) if (!termKeys.has(t)) err(`subject ${sub.id}: unknown glossary term "${t}"`);
  for (const k of ['objectives', 'questions']) {
    if (sub[`${k}Nl`].length !== sub[`${k}En`].length) err(`subject ${sub.id}: ${k}Nl/${k}En length mismatch`);
  }
}

// --- catecheses / videos / lessons ------------------------------------------
const catDates = new Set();
for (const c of catecheses.items) {
  if (catDates.has(c.date)) err(`duplicate catechesis ${c.date}`);
  catDates.add(c.date);
  if (!c.url.startsWith('https://www.vatican.va/')) err(`catechesis ${c.date}: url must be vatican.va`);
  if (c.docId && !docIds.has(c.docId)) err(`catechesis ${c.date}: unknown doc ${c.docId}`);
  for (const p of c.paragraphs ?? []) checkRef(p, `catechesis ${c.date}`);
}
const videoIds = new Set();
for (const v of videos.items) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId)) err(`video ${v.youtubeId}: invalid YouTube id`);
  if (videoIds.has(v.youtubeId)) err(`duplicate video ${v.youtubeId}`);
  videoIds.add(v.youtubeId);
  for (const d of v.docIds) if (!docIds.has(d)) err(`video ${v.youtubeId}: unknown doc ${d}`);
  for (const sId of v.subjectIds) if (!subjectIds.has(sId)) err(`video ${v.youtubeId}: unknown subject ${sId}`);
}
for (const c of catecheses.items) if (c.videoId && !videoIds.has(c.videoId)) err(`catechesis ${c.date}: unknown video ${c.videoId}`);
const lessonIds = new Set();
for (const l of lessons) {
  lessonIds.add(l.id);
  for (const sec of l.sections) for (const r of sec.refs) checkRef(r, `lesson ${l.id}`);
  for (const p of l.paragraphs) checkRef(p, `lesson ${l.id}`);
  for (const d of l.catecheses) if (!catDates.has(d)) err(`lesson ${l.id}: unknown catechesis ${d}`);
  for (const v of l.videos) if (!videoIds.has(v)) err(`lesson ${l.id}: unknown video ${v}`);
  for (const sId of l.subjects) if (!subjectIds.has(sId)) err(`lesson ${l.id}: unknown subject ${sId}`);
  for (const [i, qz] of l.quiz.entries()) {
    if (qz.answer < 0 || qz.answer >= qz.options.length) err(`lesson ${l.id} quiz ${i}: answer out of range`);
    if (qz.ref) checkRef(qz.ref, `lesson ${l.id} quiz ${i}`);
  }
}
for (const v of videos.items) for (const l of v.lessonIds) if (!lessonIds.has(l)) err(`video ${v.youtubeId}: unknown lesson ${l}`);

// --- report -----------------------------------------------------------------
for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error ${e}`);
  console.error(`\nContent validation failed with ${errors.length} error(s).`);
  process.exit(1);
}

const allReviewed = [...available].every((id) => read(`${id}.json`).review === 'verified');
const index = {
  version: hash.digest('hex').slice(0, 12),
  review: allReviewed ? 'verified' : 'unverified',
  available,
  counts,
};
writeFileSync(join(root, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(
  `content ok · ${documents.length} documents · ${available.length} with paragraphs · ${paragraphs.size} paragraphs · ${claims.length} claims · ${glossary.length} terms · ${subjects.length} subjects · ${lessons.length} lessons · ${catecheses.items.length} catecheses · ${videos.items.length} videos · v${index.version}`,
);
