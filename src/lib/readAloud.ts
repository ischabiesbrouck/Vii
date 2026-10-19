import { getDocuments } from '@/lib/content';
import { chunks, rankVoices, speakable } from '@/lib/speech';
import { useSpeech } from '@/store/speech';
import { useUi } from '@/store/ui';
import type { Lang } from '@/types/content';

/*
 * Reads the current page aloud with the device's speech engine (Web Speech API).
 * The page is split into blocks (headings, paragraphs, list items, quotations);
 * each block is read in short utterances and highlighted while it is read.
 * Pausing cancels and later restarts the current block, which behaves the same
 * on every engine (Chrome on Android has no real pause).
 */

const BLOCKS = 'h1, h2, h3, h4, p, li, blockquote, dt, dd';
/** Never read: navigation, captions, Latin, controls, hidden text, and anything marked data-tts-skip. */
const SKIP = 'nav, figcaption, button, select, label, [data-tts-skip], [lang="la"], [aria-hidden="true"], .sr-only';

let blocks: HTMLElement[] = [];
let texts: string[] = [];
let generation = 0;
/** Utterances kept referenced until they finish: Safari drops onend for collected ones. */
const live = new Set<SpeechSynthesisUtterance>();
let wakeLock: { release: () => Promise<void> } | null = null;

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/** Voices load asynchronously in Chrome and Safari. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([]);
  const now = speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    window.setTimeout(done, 1500);
  });
}

export async function chosenVoice(lang: Lang): Promise<SpeechSynthesisVoice | undefined> {
  const voices = await loadVoices();
  const uri = useSpeech.getState().voice[lang];
  return (uri && voices.find((v) => v.voiceURI === uri)) || rankVoices(voices, lang)[0]?.voice;
}

/** True if `node` sits inside something that must not be read, looking no further up than `root`. */
function skipped(node: Node, root: HTMLElement): boolean {
  for (let el = node instanceof HTMLElement ? node : node.parentElement; el && el !== root.parentElement; el = el.parentElement) {
    if (el.matches(SKIP)) return true;
  }
  return false;
}

function textOf(el: HTMLElement, root: HTMLElement): string {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let out = el.dataset.ttsBefore ? `${el.dataset.ttsBefore}. ` : '';
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!skipped(n, root)) out += n.textContent ?? '';
  return out.replace(/\s+/g, ' ').trim();
}

function collect(root: HTMLElement): { els: HTMLElement[]; texts: string[] } {
  const els: HTMLElement[] = [];
  const out: string[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(BLOCKS)) {
    if (skipped(el, root) || !el.getClientRects().length) continue;
    // A block inside another block (a paragraph in a list item) is read with its parent.
    const outer = el.parentElement?.closest(BLOCKS);
    if (outer && root.contains(outer)) continue;
    const text = textOf(el, root);
    if (text.length < 2) continue;
    els.push(el);
    out.push(text);
  }
  return { els, texts: out };
}

/** The first block still on screen, so reading starts where the reader is. */
function firstVisible(): number {
  if (window.scrollY < 150) return 0;
  const i = blocks.findIndex((el) => el.getBoundingClientRect().bottom > 96);
  return Math.max(0, i);
}

function highlight(i: number | null) {
  blocks.forEach((el, k) => el.classList.toggle('tts-current', k === i));
  const el = i === null ? undefined : blocks[i];
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top < 96 || r.bottom > window.innerHeight - 140) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }
}

async function keepAwake(on: boolean) {
  try {
    if (on && !wakeLock) wakeLock = await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null;
    if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}

let titles: Record<string, string> | null = null;
async function docTitles() {
  if (!titles) titles = Object.fromEntries((await getDocuments()).map((d) => [d.abbr, d.titleLa]));
  return titles;
}

async function speakBlock(i: number) {
  const gen = ++generation;
  speechSynthesis.cancel();
  const lang = useUi.getState().lang;
  const [voice, t] = await Promise.all([chosenVoice(lang), docTitles()]);
  if (gen !== generation) return;
  useSpeech.setState({ index: i, status: 'playing' });
  highlight(i);
  const parts = chunks(speakable(texts[i] ?? '', lang, t));
  let k = 0;
  const next = () => {
    if (gen !== generation) return;
    if (k >= parts.length) {
      if (i + 1 < blocks.length) void speakBlock(i + 1);
      else stop();
      return;
    }
    const u = new SpeechSynthesisUtterance(parts[k++]);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? (lang === 'nl' ? 'nl-NL' : 'en-GB');
    u.rate = useSpeech.getState().rate;
    u.onend = () => {
      live.delete(u);
      next();
    };
    u.onerror = (e) => {
      live.delete(u);
      if (gen !== generation || e.error === 'interrupted' || e.error === 'canceled') return;
      next();
    };
    live.add(u);
    speechSynthesis.speak(u);
  };
  // Some engines ignore a speak() issued in the same task as cancel().
  window.setTimeout(next, 60);
}

/** Read `root` aloud from the first visible block. */
export function start(root: HTMLElement) {
  if (!speechSupported()) return;
  stop();
  const c = collect(root);
  blocks = c.els;
  texts = c.texts;
  if (!blocks.length) return;
  useSpeech.setState({ total: blocks.length });
  void keepAwake(true);
  void speakBlock(firstVisible());
}

export function pause() {
  generation++;
  speechSynthesis.cancel();
  useSpeech.setState({ status: 'paused' });
  void keepAwake(false);
}

export function resume() {
  if (!blocks.length) return;
  void keepAwake(true);
  void speakBlock(useSpeech.getState().index);
}

export function skip(delta: number) {
  if (!blocks.length) return;
  const i = Math.min(blocks.length - 1, Math.max(0, useSpeech.getState().index + delta));
  if (useSpeech.getState().status === 'playing') void speakBlock(i);
  else {
    useSpeech.setState({ index: i });
    highlight(i);
  }
}

export function stop() {
  generation++;
  if (speechSupported()) speechSynthesis.cancel();
  highlight(null);
  blocks = [];
  texts = [];
  live.clear();
  useSpeech.setState({ status: 'idle', index: 0, total: 0 });
  void keepAwake(false);
}

/** Apply a new voice or speed straight away by restarting the current block. */
export function restartCurrent() {
  if (useSpeech.getState().status === 'playing') void speakBlock(useSpeech.getState().index);
}

/** Say one sentence with a given voice (voice picker preview). */
export function preview(voice: SpeechSynthesisVoice, text: string) {
  stopPreview();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = useSpeech.getState().rate;
  u.onend = () => live.delete(u);
  live.add(u);
  speechSynthesis.speak(u);
}

function stopPreview() {
  if (useSpeech.getState().status !== 'idle') pause();
  else speechSynthesis.cancel();
}
