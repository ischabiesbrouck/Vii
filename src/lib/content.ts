import { CONTENT_BASE, CONTENT_MODE } from '@/config';
import type {
  ClaimCheck,
  ContentIndex,
  CouncilDocument,
  DocumentContent,
  ExternalSource,
  GlossaryTerm,
  Subject,
  HermeneuticsModule,
  Lang,
  Paragraph,
  TimelineEvent,
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

export async function getDocument(id: string): Promise<CouncilDocument | undefined> {
  return (await getDocuments()).find((d) => d.id === id);
}

/**
 * Paragraph content for a document, or null when no /content/{docId}.json exists yet.
 * TODO(content): the 13 documents without a content file show metadata only until
 * their file is added — no code change required, see README → Adding content.
 */
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
  const out: { paragraph: Paragraph; doc: CouncilDocument }[] = [];
  for (const doc of docs) {
    if (!index.available.includes(doc.id)) continue;
    const content = await load<DocumentContent>(`${doc.id}.json`);
    for (const paragraph of content.paragraphs) out.push({ paragraph, doc });
  }
  return out;
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
