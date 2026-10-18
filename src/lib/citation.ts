import type { CouncilDocument, Lang } from '@/types/content';

/** Short reference: 'LG §8'. */
export function shortCite(paragraphId: string): string {
  const [abbr, num] = paragraphId.split('-');
  return `${abbr} §${num}`;
}

/** Full citation: 'LG §8 (Tweede Vaticaans Concilie, 1964)'. */
export function fullCite(paragraphId: string, doc: Pick<CouncilDocument, 'promulgated'>, lang: Lang): string {
  const council = lang === 'en' ? 'Second Vatican Council' : 'Tweede Vaticaans Concilie';
  return `${shortCite(paragraphId)} (${council}, ${doc.promulgated.slice(0, 4)})`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for contexts without the async clipboard API.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
