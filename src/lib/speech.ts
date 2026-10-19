import type { Lang } from '@/types/content';

/*
 * Read-aloud helpers (pure, no DOM): ranking the device's voices, preparing text
 * for speech, and cutting it into utterances short enough for every engine.
 *
 * The Web Speech API does not say whether a voice is male or female, so male
 * voices are recognised by name. The list covers the voices that ship with the
 * major platforms: Microsoft (Edge natural voices and Windows desktop voices),
 * Apple (iOS, iPadOS, macOS) and Google (Chrome on the desktop).
 */

export interface VoiceLike {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
}

export interface RankedVoice<V extends VoiceLike = VoiceLike> {
  voice: V;
  score: number;
  male: boolean;
  /** Synthesised by the browser maker's server: the text leaves the device. */
  online: boolean;
}

const MALE = [
  // Dutch
  'maarten', 'arnaud', 'xander', 'frank',
  // English: Microsoft natural and desktop voices
  'guy', 'christopher', 'eric', 'roger', 'steffan', 'andrew', 'brian', 'davis', 'tony', 'jason', 'ryan', 'thomas', 'william', 'liam', 'connor', 'mitchell', 'david', 'george', 'mark', 'james', 'richard',
  // English: Apple
  'daniel', 'arthur', 'alex', 'aaron', 'evan', 'nathan', 'tom', 'oliver', 'gordon', 'lee', 'rishi',
];
const MALE_RE = new RegExp(`\\b(${MALE.join('|')})\\b`);
/** Voices preferred above other male voices of the same language, best first. */
const PREFERRED: Record<Lang, string[]> = {
  nl: ['maarten', 'arnaud', 'xander', 'frank'],
  en: ['ryan', 'thomas', 'guy', 'christopher', 'andrew', 'brian', 'daniel', 'arthur', 'google uk english male'],
};
/** Novelty and robotic voices (macOS, Eloquence) that are unsuitable for reading. */
const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|kathy)\b/;

const norm = (lang: string) => lang.replace('_', '-').toLowerCase();

export function isMale(name: string): boolean {
  const n = name.toLowerCase();
  return /\bmale\b/.test(n) || MALE_RE.test(n);
}

/** Voices for `lang`, best first: male, then natural/premium quality, then the local dialect. */
export function rankVoices<V extends VoiceLike>(voices: readonly V[], lang: Lang): RankedVoice<V>[] {
  const out: RankedVoice<V>[] = [];
  for (const voice of voices) {
    const l = norm(voice.lang);
    if (!l.startsWith(lang)) continue;
    const name = voice.name.toLowerCase();
    if (NOVELTY.test(name)) continue;
    const male = isMale(voice.name);
    let score = 0;
    if (male) score += 50;
    const pref = PREFERRED[lang].findIndex((p) => name.includes(p));
    if (male && pref >= 0) score += 20 - pref * 2;
    if (/natural|neural/.test(name)) score += 40;
    else if (/premium/.test(name)) score += 30;
    else if (/enhanced|verbeterd|erweitert/.test(name)) score += 20;
    else if (name.startsWith('google')) score += 10;
    if (lang === 'nl') score += l === 'nl-nl' ? 6 : l === 'nl-be' ? 3 : 0;
    else score += l === 'en-gb' ? 6 : l === 'en-us' ? 4 : 0;
    out.push({ voice, score, male, online: voice.localService === false });
  }
  return out.sort((a, b) => b.score - a.score || a.voice.name.localeCompare(b.voice.name));
}

/** A short display name: "Microsoft Maarten Online (Natural) - Dutch (Netherlands)" → "Maarten". */
export function voiceLabel(name: string): string {
  return (
    name
      .replace(/^Microsoft\s+/i, '')
      .replace(/\s+Online\s*\(Natural\)/i, '')
      .replace(/\s+-\s+.*$/, '')
      .trim() || name
  );
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
function romanToInt(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN[s[i]!]!;
    const next = ROMAN[s[i + 1] ?? ''] ?? 0;
    n += v < next ? -v : v;
  }
  return n;
}

const ORD_NL = ['', 'eerste', 'tweede', 'derde', 'vierde', 'vijfde', 'zesde', 'zevende', 'achtste', 'negende', 'tiende', 'elfde', 'twaalfde', 'dertiende', 'veertiende', 'vijftiende', 'zestiende', 'zeventiende', 'achttiende', 'negentiende', 'twintigste', 'eenentwintigste', 'tweeëntwintigste', 'drieëntwintigste'];
const ORD_EN = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third'];

const POPES = 'Pius|Johannes Paulus|Johannes|Paulus|Leo|Benedictus|Gregorius|Clemens|Innocentius|Bonifatius|Urbanus|John Paul|John|Paul|Benedict|Gregory|Clement|Innocent|Boniface|Urban';
const POPE_RE = new RegExp(`\\b(${POPES}) ([IVXL]{1,6})\\b`, 'g');
const COUNCIL_RE = /\b(Vaticanum|Vaticaans Concilie|Vatican|Vatican Council|Lateranum|Lateran Council) ([IVX]{1,4})\b/g;
const CITE_RE = /\b(SC|IM|LG|OE|UR|CD|PC|OT|GE|NA|DV|AA|DH|AG|PO|GS) §(\d+)(?:[–-](\d+))?/g;

const ABBR: Record<Lang, [RegExp, string][]> = {
  nl: [
    [/\bca\.\s?/g, 'circa '],
    [/\bbv\.\s?/g, 'bijvoorbeeld '],
    [/\bnr\.\s?/g, 'nummer '],
    [/\bo\.a\.\s?/g, 'onder andere '],
    [/\bd\.w\.z\.\s?/g, 'dat wil zeggen '],
    [/\be\.a\.\s?/g, 'en anderen '],
    [/\bhfdst\.\s?/g, 'hoofdstuk '],
  ],
  en: [
    [/\be\.g\.\s?/g, 'for example '],
    [/\bi\.e\.\s?/g, 'that is '],
    [/\bcf\.\s?/g, 'compare '],
    [/\bc\.\s?(?=\d)/g, 'circa '],
    [/\bno\.\s?(?=\d)/g, 'number '],
    [/\bch\.\s?(?=\d)/g, 'chapter '],
  ],
};

/**
 * Text as it should sound: "LG §8–10" → "Lumen Gentium, paragrafen 8 tot 10",
 * "Pius XII" → "Pius de twaalfde", "Vaticanum II" → "Vaticanum twee", emphasis
 * marks removed, common abbreviations written out.
 */
export function speakable(text: string, lang: Lang, titles: Record<string, string> = {}): string {
  const nl = lang === 'nl';
  let s = text.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  s = s.replace(CITE_RE, (_m, abbr: string, a: string, b?: string) => {
    const title = titles[abbr] ?? abbr;
    if (b) return nl ? `${title}, paragrafen ${a} tot ${b}` : `${title}, paragraphs ${a} to ${b}`;
    return nl ? `${title}, paragraaf ${a}` : `${title}, paragraph ${a}`;
  });
  s = s.replace(/§§?\s?(\d+)/g, nl ? 'paragraaf $1' : 'paragraph $1');
  s = s.replace(POPE_RE, (m, name: string, roman: string) => {
    const n = romanToInt(roman);
    const ord = (nl ? ORD_NL : ORD_EN)[n];
    return ord ? `${name} ${nl ? 'de' : 'the'} ${ord}` : m;
  });
  s = s.replace(COUNCIL_RE, (_m, name: string, roman: string) => `${name} ${numberWord(romanToInt(roman), lang)}`);
  s = s.replace(/(\d)\s?[–-]\s?(\d)/g, nl ? '$1 tot $2' : '$1 to $2');
  for (const [re, by] of ABBR[lang]) s = s.replace(re, by);
  return s.replace(/\s?·\s?/g, ', ').replace(/\s+/g, ' ').trim();
}

function numberWord(n: number, lang: Lang): string {
  const nl = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien'];
  const en = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  return (lang === 'nl' ? nl : en)[n] ?? String(n);
}

/**
 * Utterances of at most `max` characters, cut at sentence ends and, for very long
 * sentences, at commas. Chrome's online voices stop after about fifteen seconds of
 * continuous speech, so long paragraphs must not go out as one utterance.
 */
export function chunks(text: string, max = 220): string[] {
  const sentences = text.split(/(?<=[.!?;:])\s+/).flatMap((s) => (s.length <= max ? [s] : s.split(/(?<=,)\s+/)));
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && cur.length + s.length + 1 > max) {
      out.push(cur);
      cur = s;
    } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) out.push(cur);
  return out.filter((c) => /\w/.test(c));
}
