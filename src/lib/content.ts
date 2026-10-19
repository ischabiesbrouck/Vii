import { CONTENT_BASE, CONTENT_MODE } from '@/config';
import type {
  ClaimCheck,
  ContentIndex,
  CouncilDocument,
  DocumentContent,
  ExternalSource,
  GlossaryTerm,
  Subject,
  Lesson,
  CatechesisSeries,
  VideoLibrary,
  HermeneuticsModule,
  Lang,
  Paragraph,
  TimelineEvent,
  Study,
  LicensedImage,
  ShortCatechesis,
} from '@/types/content';

/**
 * Static content loader. Every file lives under /public/content and is
 * precached by the service worker, so after first load these fetches are
 * served from cache — no network.
 */
const cache = new Map<string, Promise<unknown>>();

function load<T>(file: string): Promise<T> {
  let p = cache.get(file) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`${CONTENT_BASE}/${file}`).then((r) => {
      if (!r.ok) throw new Error(`${file}: ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(file));
    cache.set(file, p);
  }
  return p;
}

export const getIndex = () => load<ContentIndex>('index.json');
export const getDocuments = () => load<CouncilDocument[]>('documents.json');
export const getClaims = () => load<ClaimCheck[]>('claims.json');
export const getTimeline = () => load<TimelineEvent[]>('timeline.json');
export const getGlossary = () => load<GlossaryTerm[]>('glossary.json');
export const getHermeneutics = () => load<HermeneuticsModule>('hermeneutics.json');
export const getSources = () => load<ExternalSource[]>('sources.json');
export const getSubjects = () => load<Subject[]>('subjects.json');
export const getLessons = () => load<Lesson[]>('lessons.json');
export const getCatecheses = () => load<CatechesisSeries>('catecheses.json');
export const getVideos = () => load<VideoLibrary>('videos.json');
export const getImages = () => load<LicensedImage[]>('images.json').catch(() => [] as LicensedImage[]);

/** The short catecheses, in series order. */
export async function getShortCatecheses(): Promise<ShortCatechesis[]> {
  const index = await getIndex();
  return Promise.all((index.catechesis ?? []).map((id) => load<ShortCatechesis>(`catechesis/${id}.json`)));
}

/** Full study text for a subject, or null when none has been written yet. */
export async function getStudy(subjectId: string): Promise<Study | null> {
  const index = await getIndex();
  if (!index.studies?.includes(subjectId)) return null;
  return load<Study>(`studies/${subjectId}.json`);
}

export async function getDocument(id: string): Promise<CouncilDocument | undefined> {
  return (await getDocuments()).find((d) => d.id === id);
}

/** Paragraph excerpts for a document, or null when it has no content file (the reader then shows metadata only). */
export async function getDocumentContent(docId: string): Promise<DocumentContent | null> {
  const index = await getIndex();
  if (!index.available.includes(docId)) return null;
  return load<DocumentContent>(`${docId}.json`);
}

export async function docByAbbr(abbr: string): Promise<CouncilDocument | undefined> {
  return (await getDocuments()).find((d) => d.abbr === abbr);
}

/** Resolve a paragraph id like 'LG-8' to its paragraph and document. */
export async function getParagraph(
  id: string,
): Promise<{ paragraph: Paragraph; doc: CouncilDocument } | null> {
  const abbr = id.split('-')[0] ?? '';
  const doc = await docByAbbr(abbr);
  if (!doc) return null;
  const content = await getDocumentContent(doc.id);
  const paragraph = content?.paragraphs.find((p) => p.id === id);
  return paragraph ? { paragraph, doc } : null;
}

export async function getAllParagraphs(): Promise<{ paragraph: Paragraph; doc: CouncilDocument }[]> {
  const [docs, index] = await Promise.all([getDocuments(), getIndex()]);
  const available = docs.filter((d) => index.available.includes(d.id));
  const contents = await Promise.all(available.map((d) => load<DocumentContent>(`${d.id}.json`)));
  return available.flatMap((doc, i) => contents[i]!.paragraphs.map((paragraph) => ({ paragraph, doc })));
}

/** The n-th seeded paragraph (modulo the total), loading only the document that holds it. */
export async function getNthParagraph(n: number): Promise<{ paragraph: Paragraph; doc: CouncilDocument } | null> {
  const [docs, index] = await Promise.all([getDocuments(), getIndex()]);
  const available = docs.filter((d) => index.available.includes(d.id));
  const total = available.reduce((sum, d) => sum + (index.counts[d.id] ?? 0), 0);
  if (!total) return null;
  let i = n % total;
  for (const doc of available) {
    const count = index.counts[doc.id] ?? 0;
    if (i < count) {
      const paragraph = (await getDocumentContent(doc.id))?.paragraphs[i];
      return paragraph ? { paragraph, doc } : null;
    }
    i -= count;
  }
  return null;
}

/** Text to render, honouring the CONTENT_MODE licensing switch. */
export function paragraphText(p: Paragraph, lang: Lang): { text: string; isExcerpt: boolean } {
  if (CONTENT_MODE === 'full') {
    const full = lang === 'en' ? p.fullTextEn : p.fullTextNl;
    if (full) return { text: full, isExcerpt: false };
  }
  return { text: lang === 'en' ? p.textEn : p.textNl, isExcerpt: true };
}

export function paragraphUrl(id: string, docs: CouncilDocument[]): string {
  const abbr = id.split('-')[0];
  const doc = docs.find((d) => d.abbr === abbr);
  return doc ? `/documents/${doc.id}#${id}` : '/documents';
}
