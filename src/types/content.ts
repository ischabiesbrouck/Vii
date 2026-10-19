/**
 * Content model. All content is static, versioned JSON under /public/content.
 * Nothing here is ever generated at runtime.
 */

export type DocType = 'constitution' | 'decree' | 'declaration';

/**
 * Only LG and DV carry "dogmatica" and GS "pastoralis" in their official Latin
 * designation. The other documents are 'unqualified' (decrees: 'disciplinary'),
 * so that no editorial label is presented as part of the title.
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
  /** Chapter structure (contiguous ranges covering every paragraph), where known. */
  outline?: OutlineSection[];
}

export interface OutlineSection {
  labelLa: string; // 'Caput III', 'Prooemium'
  from: number;
  to: number;
  titleNl: string;
  titleEn: string;
}

export type SubjectLevel = 'start' | 'core' | 'deeper';

/** A guided study path through the texts. */
export interface Subject {
  id: string;
  icon: string;
  level: SubjectLevel;
  minutes: number;
  titleNl: string;
  titleEn: string;
  taglineNl: string;
  taglineEn: string;
  introNl: string; // editorial
  introEn: string;
  objectivesNl: string[];
  objectivesEn: string[];
  /** Ordered reading path: the sequence is part of the pedagogy. */
  steps: { paragraphId: string; focusNl: string; focusEn: string }[];
  claims: string[]; // ClaimCheck ids
  terms: string[]; // GlossaryTerm.term keys
  questionsNl: string[];
  questionsEn: string[];
  furtherReading: { citation: string; url?: string }[];
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
  /** Number of seeded paragraphs per docId. */
  counts: Record<string, number>;
  /** Subject ids that have a study text in /content/studies/. */
  studies?: string[];
}

/** A lesson in the guided course (/learn). Editorial, labelled as such. */
export interface Lesson {
  id: string;
  number: number;
  labelLa: string; // 'Lectio I'
  minutes: number;
  titleNl: string;
  titleEn: string;
  summaryNl: string;
  summaryEn: string;
  sections: { headingNl: string; headingEn: string; bodyNl: string; bodyEn: string; refs: string[] }[];
  facts: { labelNl: string; labelEn: string; valueNl: string; valueEn: string }[];
  paragraphs: string[]; // key texts to read
  catecheses: string[]; // ISO dates of Leo XIV catecheses
  videos: string[]; // YouTube ids
  subjects: string[];
  /** Factual knowledge check (dates, texts) — never a test of personal orthodoxy. */
  quiz: {
    questionNl: string;
    questionEn: string;
    options: { nl: string; en: string }[];
    answer: number;
    explainNl: string;
    explainEn: string;
    ref?: string;
  }[];
  sources: string[];
}

export interface Catechesis {
  date: string;
  part: 'intro' | 'DV' | 'LG' | 'SC' | 'GS';
  number: number;
  docId: string | null;
  titleEn: string; // official English title
  titleNl: string; // working translation
  url: string; // vatican.va
  paragraphs?: string[];
  videoId?: string;
}

export interface CatechesisSeries {
  seriesTitleEn: string;
  seriesTitleNl: string;
  introNl: string;
  introEn: string;
  checkedOn: string;
  items: Catechesis[];
}

export type VideoKind = 'overview' | 'history' | 'document' | 'interpretation' | 'catechesis' | 'primary-source';

export interface Video {
  youtubeId: string;
  title: string;
  channel: string; // '—' when the uploader could not be confirmed
  channelConfirmed: boolean;
  kind: VideoKind;
  whyNl: string;
  whyEn: string;
  perspectiveNl?: string;
  perspectiveEn?: string;
  length?: string; // only when a source states it
  docIds: string[];
  subjectIds: string[];
  lessonIds: string[];
}

export interface VideoLibrary {
  checkedOn: string;
  noteNl: string;
  noteEn: string;
  items: Video[];
}

/* ---------- Study texts (full editorial explanation per subject) ---------- */

export type DiagramId =
  | 'sessions'
  | 'documents'
  | 'votes'
  | 'dv-transmission'
  | 'lg-belonging'
  | 'lg-people'
  | `outline-${'LG' | 'SC' | 'DV' | 'DH' | 'GS' | 'UR' | 'PO' | 'CD'}`;

export type StudyBlock =
  /** Editorial prose. Citations written as "LG §8" or "GS §22–24" are linked automatically. */
  | { type: 'p'; nl: string; en: string }
  /** A conciliar excerpt, rendered from the seeded paragraph (never retyped). */
  | { type: 'quote'; paragraphId: string }
  | { type: 'list'; nl: string[]; en: string[] }
  | { type: 'box'; kind: 'term' | 'note' | 'context'; titleNl: string; titleEn: string; nl: string; en: string }
  /** Contested questions: positions side by side, never decided by the app. */
  | { type: 'positions'; titleNl: string; titleEn: string; positions: { labelNl: string; labelEn: string; nl: string; en: string; sources: string[] }[] }
  | { type: 'diagram'; id: DiagramId; captionNl: string; captionEn: string }
  /** A licensed image from public/content/images.json. */
  | { type: 'image'; imageId: string; captionNl: string; captionEn: string };

export interface StudySection {
  headingNl: string;
  headingEn: string;
  blocks: StudyBlock[];
}

export interface StudyChapter {
  labelLa: string; // 'Caput I'
  titleNl: string;
  titleEn: string;
  summaryNl: string;
  summaryEn: string;
  sections: StudySection[];
}

export interface Study {
  subjectId: string;
  review: 'unverified' | 'verified';
  chapters: StudyChapter[];
  /** APA 7 references for the whole study text. */
  bibliography: string[];
}

export interface LicensedImage {
  id: string;
  file: string; // path under public/images/
  width: number;
  height: number;
  altNl: string;
  altEn: string;
  author: string;
  license: string; // e.g. 'Public domain', 'CC BY-SA 4.0'
  licenseUrl?: string;
  sourceUrl: string; // Wikimedia Commons file page
}
