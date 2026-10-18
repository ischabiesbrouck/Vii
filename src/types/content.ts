/**
 * Content model. All content is static, versioned JSON under /public/content.
 * Nothing here is ever generated at runtime.
 *
 * Deviations from the original brief are marked DEVIATION and explained in README.md.
 */

export type DocType = 'constitution' | 'decree' | 'declaration';

/**
 * DEVIATION: 'unqualified' added. Only LG and DV carry "dogmatica" and GS
 * "pastoralis" in their official Latin designation; labelling SC or the
 * declarations otherwise would be an editorial judgement presented as fact.
 */
export type Solemnity = 'dogmatic' | 'pastoral' | 'disciplinary' | 'unqualified';

export type Lang = 'nl' | 'en';

export interface CouncilDocument {
  id: string; // 'lumen-gentium'
  abbr: string; // 'LG'
  titleLa: string; // 'Lumen Gentium'
  titleNl: string;
  titleEn: string;
  /** Official Latin designation, e.g. 'Constitutio dogmatica de Ecclesia'. */
  designationLa: string;
  type: DocType;
  solemnity: Solemnity;
  promulgated: string; // ISO date
  promulgatedBy: 'John XXIII' | 'Paul VI';
  voteFor: number | null; // placet, final vote at the public session
  voteAgainst: number | null; // non placet
  /** Total number of articles (§) in the document. */
  paragraphCount: number;
  summaryNl: string; // max 80 words, editorial
  summaryEn: string; // max 80 words, editorial
  keyParagraphs: string[]; // paragraph ids
  officialUrl: string; // vatican.va (English)
  officialUrlLa: string; // vatican.va (Latin)
}

export interface Paragraph {
  id: string; // 'LG-8'
  docId: string;
  number: number;
  /** In CONTENT_MODE 'excerpt': a short excerpt (quotation right). */
  textNl: string;
  textEn: string;
  /** Optional short Latin excerpt of the editio typica. */
  textLa?: string;
  /** Only used when CONTENT_MODE === 'full' and licensing is cleared. */
  fullTextNl?: string;
  fullTextEn?: string;
  tags: string[];
  /** Other paragraph ids ('LG-14') or external sources ('ext:pastor-aeternus-1870'). */
  crossRefs: string[];
  noteNl?: string; // editorial, labelled "Toelichting"
  noteEn?: string;
}

export type ReviewStatus = 'unverified' | 'verified';

export interface DocumentContent {
  docId: string;
  /** Provenance of the excerpts, shown in the reader. */
  sourceNl: string;
  sourceEn: string;
  review: ReviewStatus;
  paragraphs: Paragraph[];
}

export type Verdict = 'supported' | 'not-in-the-text' | 'partly' | 'contested';
export type HeardFrom = 'progressive-reading' | 'traditionalist-reading' | 'secular-media';

export interface ClaimPosition {
  labelNl: string;
  labelEn: string;
  summaryNl: string;
  summaryEn: string;
  sources: string[]; // APA7 strings
}

export interface ClaimCheck {
  id: string;
  claim: string; // Dutch, quoted neutrally
  claimEn: string;
  heardFrom: HeardFrom;
  verdict: Verdict;
  evidence: { paragraphId: string; relevance: string; relevanceEn: string }[];
  explanationNl: string;
  explanationEn: string;
  /** Required when verdict === 'contested': positions shown side by side, unresolved. */
  positions?: ClaimPosition[];
  furtherReading: { citation: string; url?: string }[]; // APA7 strings
}

export interface TimelineEvent {
  date: string;
  sessionNumber: 1 | 2 | 3 | 4 | null;
  titleNl: string;
  titleEn: string;
  bodyNl: string;
  bodyEn: string;
  sourceCitation: string;
  /** Documents promulgated on this date. */
  docIds?: string[];
}

export interface GlossaryTerm {
  term: string;
  termEn: string;
  definitionNl: string;
  definitionEn: string;
  /** Paragraph id of first use in the conciliar texts, or null if the term does not occur in them. */
  firstUse: string | null;
  disputed: boolean;
}

export interface ExternalSource {
  id: string; // 'ext:pastor-aeternus-1870'
  citation: string; // APA7
  url?: string;
}

export interface HermeneuticPosition {
  id: string;
  labelNl: string;
  labelEn: string;
  thesisNl: string;
  thesisEn: string;
  appealsTo: { paragraphId: string; noteNl: string; noteEn: string }[];
  criticismNl: string;
  criticismEn: string;
  sources: string[];
}

export interface HermeneuticsModule {
  introNl: string;
  introEn: string;
  positions: HermeneuticPosition[];
  principlesNl: string[];
  principlesEn: string[];
  principlesSource: string;
}

export interface ContentIndex {
  /** Content hash; bumps whenever any content file changes. */
  version: string;
  review: ReviewStatus;
  /** docIds that have a /content/{docId}.json file. */
  available: string[];
}
