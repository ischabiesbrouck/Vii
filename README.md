# Concilium — *Vaticanum II in context*

A local-first, installable PWA that puts the reader in direct contact with the
16 documents of the Second Vatican Council (1962–1965) and their paragraph
numbers. Dutch by default, English toggle. No backend, no accounts, no
analytics, no network requests at runtime after the service worker installs.

> **Concilium is a study aid, not the magisterium.** The official texts are on
> [vatican.va](https://www.vatican.va/archive/hist_councils/ii_vatican_council/index.htm).

## Quick start

```bash
npm install
npm run dev        # validates content, then starts Vite
npm run build      # tsc --noEmit → content validation → vite build (+ service worker)
npm run preview    # serve dist/ to test install + offline
```

Deploy `dist/` to any static host with an SPA fallback to `index.html`
(`public/_redirects` for Netlify and `vercel.json` for Vercel are included).

## Stack

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS 3 with shadcn/ui-style
components (Radix Dialog) · react-router-dom 6 (history routing) ·
vite-plugin-pwa (Workbox, `autoUpdate`) · MiniSearch (index cached in
IndexedDB via Dexie) · Zustand (persisted to localStorage) · i18next ·
self-hosted Source Serif 4 and Inter (Fontsource).

## Routes

| Route | Purpose |
|---|---|
| `/` | Hero search, start-here subject, figures, continue reading, bookmarks, subjects, document of the day, Claim Check, the four sessions |
| `/subjects`, `/subjects/:id` | **Subjects**: 13 guided study paths (start / core / deeper). Each has objectives, an ordered reading path of excerpts with "studied" ticks (saved locally), related claims and terms, reflection questions and further reading |
| `/documents` | The 16 documents by type, with solemnity badge |
| `/documents/:id` | Reader: title page with vote bar, chapter outline (Caput I, II …) as sticky contents on desktop and a sheet on mobile, rubric-red marginal § numbers, previous/next document, related subjects; § anchors, sticky §-jump, 3 font sizes, progress bar; tap → sheet (cross-refs, note, copy/share citation, bookmark); long-press → copy citation |
| `/claims`, `/claims/:id` | Claim Check, filterable by verdict; evidence paragraphs inline; contested claims show positions side by side |
| `/search` | Offline full-text search (paragraphs, claims, terms); `LG 8` jumps to the paragraph |
| `/timeline` | 1959 announcement → 1965 closing, by session |
| `/glossary` | Searchable terms, disputed terms flagged |
| `/hermeneutics` | Continuity / event / rupture readings, unresolved, with sources |
| `/about` | Method, content status, licensing, privacy, sources, settings |

## Content

All content is static JSON in `public/content/`, reviewable in the repo and
precached by the service worker. Nothing is generated at runtime.

| File | Contents |
|---|---|
| `documents.json` | Metadata for all 16 documents (dates, votes, designation, summaries ≤ 80 words) |
| `{docId}.json` | Paragraph excerpts. Seeded: LG, SC, DH (scaffold) + NA, DV, GS, AA, PO, UR, AG (paragraphs cited as evidence) |
| `subjects.json` | 13 study paths; every step, claim and term is checked by the validator |
| `claims.json` | 16 Claim Checks covering progressive, traditionalist and secular-media misreadings |
| `timeline.json`, `glossary.json`, `hermeneutics.json` | Supporting modules |
| `sources.json` | Registry of external (pre- and post-conciliar) sources referenced as `ext:…` |

### Adding a document's content

1. Create `public/content/{docId}.json` following `DocumentContent` in
   `src/types/content.ts` (paragraph ids are `ABBR-number`, e.g. `CD-11`).
2. Run `npm run validate:content`. The file is picked up automatically: no
   code change. TODO: 4 documents (IM, OE, CD, OT) have no content file yet; the
   other non-scaffold files hold only the paragraphs that claims and subjects cite.

### Fidelity gate

`scripts/validate-content.mjs` runs before every dev start and build and fails
the build if any claim evidence, cross-reference, glossary entry, hermeneutics
appeal or key paragraph does not resolve to a seeded paragraph or registered
source. It also enforces the 80-word summary limit, requires two or more positions
for every `contested` claim, and writes `index.json` (the list of available files
plus a content hash that invalidates the cached search index).

### Review status: **unverified**

The excerpts, Dutch working translations, summaries, vote counts and Claim
Checks in this version were **drafted with AI assistance** and have **not yet
been verified line by line** against vatican.va or the *Acta Synodalia*. Each
content file carries `"review": "unverified"`, and the UI says so. Before any
public release, an editor should:

- check every `textEn` excerpt against the vatican.va translation, and every
  `textLa` against the Latin text;
- check the final-vote figures in `documents.json`;
- check bibliographic details in `claims.json` and `hermeneutics.json`;
- set `"review": "verified"` per file once checked.

## Design

The visual language follows printed conciliar editions and the Holy See's archive
pages, without using any official emblem or branding: Roman inscriptional
capitals (Cinzel) for titles and kickers, Source Serif 4 for text, Inter for UI,
rubric red for paragraph numbers (the convention of liturgical books), gold
hairlines, white paper and an ink band for the institutional strip and footer.
The footer and About page state that this is an unofficial study edition, not
affiliated with the Holy See. On desktop the app uses horizontal navigation and
multi-column layouts. On mobile it uses a five-tab bottom bar.

## Licensing guardrail

Conciliar texts and their modern translations are under copyright held by
**Libreria Editrice Vaticana** and, for Dutch, by the respective translators.
Until licensing is cleared the app ships **paragraph-level excerpts for
commentary and criticism**, plus deep links to vatican.va (EN + LA) and
rkdocumenten.nl.

The single switch is `CONTENT_MODE` in `src/config.ts` (`'excerpt' | 'full'`;
override with `VITE_CONTENT_MODE=full`). In `'full'` mode the reader renders
`fullTextNl` / `fullTextEn` where present and falls back to the excerpt
elsewhere. **Do not add full texts or switch the flag before you have written
permission.** The Dutch texts in the app are editorial working translations of
the English excerpts, labelled as such. They are not the official Dutch
translation.

## Deviations from the original brief (and why)

1. **`Solemnity` gains `'unqualified'`.** Only LG and DV are *dogmatica* and GS
   *pastoralis* in their official Latin designations. Calling SC or the
   declarations "dogmatic" or "disciplinary" would present an editorial judgement
   as fact. Decrees are labelled `disciplinary` by convention. Each document
   also carries its exact `designationLa`.
2. **Subjects tab.** The bottom bar has five tabs (Home, Subjects, Documents, Claims, Search) instead of four.
3. **Bilingual editorial fields** (`summaryEn`, `claimEn`, `explanationEn`,
   `titleEn`/`bodyEn`, `definitionEn`, `noteEn`) were added so that the EN toggle
   covers content as well as UI chrome.
4. **`ClaimCheck.positions`** holds the side-by-side positions required for
   `contested` verdicts (content rule 4).
5. **`GlossaryTerm.firstUse` may be `null`** for terms that do not occur in the
   conciliar texts (*aggiornamento*, *ressourcement*). The UI says so instead of
   pointing to a paragraph that does not contain the term.
6. **Gold text colour.** `#B08D4F` on parchment is about 2.9:1 and fails WCAG AA.
   It stays in use for borders, marks and the decree badge (with dark text), and
   gold-tinted metadata text uses `#6E5528` (about 6.5:1). In dark mode the red
   accent is lightened for text contrast.
7. **Font precache** is limited to the Latin and Latin-ext subsets. Other subsets
   are never requested for Dutch, English or Latin text.

## Acceptance checks

Verified locally with headless Chromium against `vite preview`:

- service worker installs and controls the page; with the network **offline**,
  every route, the LG reader, the paragraph sheet and search all work;
- **zero** external requests and zero failed requests after install;
- no horizontal scroll at **320 px** on any route;
- `tsc --noEmit` is clean under `strict` (+ `noUncheckedIndexedAccess`).

Not run here: a Lighthouse audit (Lighthouse 12 removed its PWA category; use
Chrome DevTools → Application → Manifest for installability), and device tests
on iOS Safari and Android Chrome.

## Out of scope

Accounts, comments, forums, AI chat, push notifications, donations, orthodoxy
quizzes, and any feature that implies the app speaks for the Church.

## Sources behind the content design

- Alberigo, G., & Komonchak, J. A. (Eds.). (1995–2006). *History of Vatican II* (Vols. 1–5). Orbis Books.
- Benedict XVI. (2005, December 22). *Address to the Roman Curia offering them his Christmas greetings*. Libreria Editrice Vaticana.
- Congregation for the Doctrine of the Faith. (2007). *Responses to some questions regarding certain aspects of the doctrine on the Church*. Libreria Editrice Vaticana.
- O'Malley, J. W. (2008). *What happened at Vatican II*. Belknap Press of Harvard University Press.
- Tanner, N. P. (Ed.). (1990). *Decrees of the ecumenical councils* (Vol. 2). Georgetown University Press.
