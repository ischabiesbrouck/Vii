/**
 * LICENSING GUARDRAIL — single switch.
 *
 * 'excerpt' (default): ship short paragraph-level excerpts for commentary and
 *   criticism, plus deep links to vatican.va. Safe without a licence.
 * 'full': render `fullTextNl` / `fullTextEn` where present. Only switch after
 *   written permission from Libreria Editrice Vaticana and, for Dutch, the
 *   translation's rights holder. See README → Licensing.
 *
 * Override at build time with VITE_CONTENT_MODE=full.
 */
export type ContentMode = 'excerpt' | 'full';

export const CONTENT_MODE: ContentMode =
  import.meta.env.VITE_CONTENT_MODE === 'full' ? 'full' : 'excerpt';

export const CONTENT_BASE = '/content';

export const OFFICIAL_INDEX_URL =
  'https://www.vatican.va/archive/hist_councils/ii_vatican_council/index.htm';
export const RKDOCUMENTEN_URL = 'https://www.rkdocumenten.nl/';
