import MiniSearch, { type Options, type SearchResult } from 'minisearch';
import { db } from './db';
import { getAllParagraphs, getClaims, getGlossary, getIndex } from './content';
import { shortCite } from './citation';

export type SearchKind = 'paragraph' | 'claim' | 'term';

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  cite: string; // 'LG §8' or claim/term label
  title: string;
  titleEn: string;
  text: string; // indexed: NL + EN + LA
  snippetNl: string;
  snippetEn: string;
  url: string;
  tags: string;
}

export type Hit = SearchResult & Omit<SearchDoc, 'id' | 'text'>;

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const OPTIONS: Options<SearchDoc> = {
  fields: ['cite', 'title', 'titleEn', 'text', 'tags'],
  storeFields: ['kind', 'cite', 'title', 'titleEn', 'snippetNl', 'snippetEn', 'url'],
  processTerm: (term) => fold(term),
  searchOptions: {
    prefix: true,
    fuzzy: 0.2,
    boost: { cite: 4, title: 2, titleEn: 2 },
    processTerm: (term) => fold(term),
  },
};

const CACHE_KEY = 'search-index';

async function buildDocs(): Promise<SearchDoc[]> {
  const [paras, claims, terms] = await Promise.all([getAllParagraphs(), getClaims(), getGlossary()]);
  const docs: SearchDoc[] = [];
  for (const { paragraph: p, doc } of paras) {
    docs.push({
      id: `p:${p.id}`,
      kind: 'paragraph',
      cite: `${shortCite(p.id)} ${doc.abbr}${p.number}`,
      title: `${doc.titleLa} — ${doc.titleNl}`,
      titleEn: `${doc.titleLa} — ${doc.titleEn}`,
      text: [p.textNl, p.textEn, p.textLa ?? '', p.noteNl ?? '', p.noteEn ?? ''].join(' '),
      snippetNl: p.textNl,
      snippetEn: p.textEn,
      url: `/documents/${doc.id}#${p.id}`,
      tags: p.tags.join(' '),
    });
  }
  for (const c of claims) {
    docs.push({
      id: `c:${c.id}`,
      kind: 'claim',
      cite: 'Claim Check',
      title: c.claim,
      titleEn: c.claimEn,
      text: [c.explanationNl, c.explanationEn].join(' '),
      snippetNl: c.explanationNl,
      snippetEn: c.explanationEn,
      url: `/claims/${c.id}`,
      tags: c.evidence.map((e) => e.paragraphId).join(' '),
    });
  }
  for (const g of terms) {
    docs.push({
      id: `t:${g.term}`,
      kind: 'term',
      cite: g.firstUse ? shortCite(g.firstUse) : '—',
      title: g.term,
      titleEn: g.termEn,
      text: [g.definitionNl, g.definitionEn].join(' '),
      snippetNl: g.definitionNl,
      snippetEn: g.definitionEn,
      url: `/glossary#${encodeURIComponent(g.term)}`,
      tags: g.disputed ? 'disputed omstreden' : '',
    });
  }
  return docs;
}

let enginePromise: Promise<MiniSearch<SearchDoc>> | null = null;

/**
 * Builds the MiniSearch index once per content version and caches it in
 * IndexedDB (Dexie). Subsequent app starts load the serialized index.
 */
export function getSearchEngine(): Promise<MiniSearch<SearchDoc>> {
  enginePromise ??= (async () => {
    const { version } = await getIndex();
    try {
      const row = await db.kv.get(CACHE_KEY);
      if (row && row.version === version) return MiniSearch.loadJSON<SearchDoc>(row.value, OPTIONS);
    } catch {
      // IndexedDB unavailable (private mode): fall through and build in memory.
    }
    const engine = new MiniSearch<SearchDoc>(OPTIONS);
    engine.addAll(await buildDocs());
    try {
      await db.kv.put({ key: CACHE_KEY, version, value: JSON.stringify(engine) });
    } catch {
      /* non-fatal */
    }
    return engine;
  })();
  enginePromise.catch(() => (enginePromise = null));
  return enginePromise;
}

/** 'LG 8', 'lg§8', 'LG §8' → 'LG-8'. */
export function parseCitationQuery(q: string): string | null {
  const m = q.trim().match(/^([a-z]{2})\s*§?\s*(\d{1,3})$/i);
  return m ? `${m[1]!.toUpperCase()}-${m[2]}` : null;
}

export async function search(q: string): Promise<Hit[]> {
  if (!q.trim()) return [];
  const engine = await getSearchEngine();
  const results = engine.search(q) as Hit[];
  // A citation query ('LG 8') puts the exact paragraph first.
  const cite = parseCitationQuery(q);
  const stored = cite ? engine.getStoredFields(`p:${cite}`) : undefined;
  if (cite && stored) {
    const exact = { id: `p:${cite}`, score: Infinity, terms: [], queryTerms: [], match: {}, ...stored } as unknown as Hit;
    return [exact, ...results.filter((r) => r.id !== exact.id)].slice(0, 60);
  }
  return results.slice(0, 60);
}
