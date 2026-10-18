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
npm test           # Vitest unit tests (citations, shuffle, content integrity, i18n key parity)
npm run check      # typecheck + content validation + tests (what CI runs)
npm run preview    # serve dist/ to test install + offline
```

Deploy `dist/` to any static host with an SPA fallback to `index.html`
(`public/_redirects` for Netlify and `vercel.json` for Vercel are included).

### GitHub Pages

`.github/workflows/deploy-pages.yml` builds and deploys on every push to `main`
to `https://<owner>.github.io/<repo>/` (here: `https://ischabiesbrouck.github.io/Vii/`).
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The build sets `BASE_PATH=/<repo>/`, which the router, manifest, icons and service
worker all follow; `404.html` provides the SPA fallback for deep links.

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
| `/learn`, `/learn/:id` | **Course**: 10 lessons (why a council, how it worked, the four constitutions, each constitution, decrees and declarations, reception, reading today), each with key facts, the texts to read, Pope Leo XIV's catecheses, videos, a factual knowledge check and sources; progress saved locally |
| `/catecheses` | Pope Leo XIV's 2026 general-audience catecheses on the Council's documents (28 so far), grouped by constitution, linking to the official texts on vatican.va |
| `/videos` | 15 curated English videos (EWTN, Rome Reports, Word on Fire, CNS, Georgetown and others), filterable by kind; they play in the in-app theater (see below) |
| `/subjects/:id/study/:chapter` | **Study text** per subject: a continuous, chaptered explanation (Caput I–V) with numbered sections, conciliar quotations, term and context boxes, side-by-side positions on disputed questions, diagrams and a bibliography. Each chapter is a page with an index, running head and pager; chapters read are remembered locally |
| `/subjects`, `/subjects/:id` | **Subjects**: 16 guided study paths (start / core / deeper). Each has objectives, an ordered reading path of excerpts with "studied" ticks (saved locally), related claims and terms, reflection questions and further reading |
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
| `{docId}.json` | Paragraph excerpts for all 16 documents (125 in total), with chapter outlines for LG, SC, DV, DH, GS, UR, PO and CD |
| `lessons.json` | 10 course lessons with knowledge checks; every reference validated |
| `catecheses.json` | Leo XIV catecheses (date, official title, Dutch working title, vatican.va URL) |
| `videos.json` | Video library; IDs and titles checked against web search results on 18 Oct 2026 |
| `subjects.json` | 16 study paths; every step, claim and term is checked by the validator |
| `studies/{subjectId}.json` | 16 study texts, 4–5 chapters each (about 38,500 words in Dutch and as many in English). Drafted with AI assistance, `review: "unverified"` |
| `images.json` + `public/images/` | Registry for licensed images (author, licence, Wikimedia Commons source); empty until images are added |
| `claims.json` | 19 Claim Checks covering progressive, traditionalist and secular-media misreadings |
| `timeline.json`, `glossary.json`, `hermeneutics.json` | Supporting modules |
| `sources.json` | Registry of external (pre- and post-conciliar) sources referenced as `ext:…` |

### Adding a document's content

1. Create `public/content/{docId}.json` following `DocumentContent` in
   `src/types/content.ts` (paragraph ids are `ABBR-number`, e.g. `CD-11`).
2. Run `npm run validate:content`. The file is picked up automatically: no
   code change. All 16 documents now have a content file (125 excerpts). LG, SC, DV, DH and
   GS are covered most fully; for the others the file holds the key paragraphs
   that claims and subjects cite. TODO: widen coverage per document.

### Fidelity gate

`scripts/validate-content.mjs` runs before every dev start and build and fails
the build if any claim evidence, cross-reference, glossary entry, hermeneutics
appeal or key paragraph does not resolve to a seeded paragraph or registered
source. It also enforces the 80-word summary limit, requires two or more positions
for every `contested` claim, and writes `index.json` (the list of available files
plus a content hash that invalidates the cached search index).

### Study texts

Study texts follow the `Study` type in `src/types/content.ts`. The validator rejects a study text if:
- a citation such as `LG §8` or `GS §22–24` falls outside the document's paragraph count;
- a `quote` names a paragraph that has not been seeded;
- an unknown diagram or image is used, or a position cites an unregistered source;
- the Dutch and English versions do not both exist, or either language has fewer than 1,200 words.

Conciliar text appears only through `quote` blocks, which render the seeded excerpt, so licensed text is never retyped. Diagrams are drawn from the app's own data, or restate a cited paragraph, so they need no image licence. Photos go in `images.json`, with author, licence and source shown under each image.

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

## Interaction

- **Quick search**: Ctrl/⌘+K or `/` opens a keyboard-driven palette over pages and the full-text index.
- **Route-level code splitting**: each page is its own chunk; vendor code is split into stable cached chunks. All of it is precached.
- **Error boundary** per page, subtle page transitions (disabled under `prefers-reduced-motion`).
- **Video theater**: videos play inside the app in one modal player (youtube-nocookie.com, `rel=0`). The app listens to the embed's documented postMessage events (no external API script; messages are accepted only from the player's own origin and window). When a video ends, the iframe is removed and replaced by the app's own end card (replay / close), so YouTube's end-screen suggestions and autoplay of a next video never appear. The position is saved locally: cards show progress, "resume from m:ss" and a "watched" mark.
- **Focus mode** in the reader hides all chrome for distraction-free reading (Esc exits).
- **Navigation**: back/forward restores the scroll position per history entry; on route change focus moves to the main region and the page title is announced to screen readers.
- **Preloading**: after first paint, idle time is used to fetch all page chunks and build the search index, so later navigation is instant.
- **Offline-ready toast** once the service worker has precached everything.

## Quality gates

- `.github/workflows/ci.yml` runs `npm run check` and a production build on every pull request and branch push.
- `.github/workflows/deploy-pages.yml` runs the tests before building and deploying `main`.

## Design

**Editio academica**: the visual language of a pontifical faculty and of the Holy
See's own publications, without any official emblem or branding.

| Reference | What is borrowed |
|---|---|
| vatican.va | Document index grouped by kind (constitutions, decrees, declarations), Latin titles in capitals before the vernacular, a plain language bar, cream and gold |
| *Acta Apostolicae Sedis* and conciliar editions | Serif typography, small caps, centred capitals for document titles, paragraph numbers in rubric red, hairline and double rules |
| Liturgical books | Rubrics and initials in red |
| Vatican News | Small red section labels with a date line ("Audientia generalis · Wednesday 7 October 2026") |
| Curial documents | Latin date line in the utility bar ("Dominica, die XVIII mensis Octobris, anno MMXXVI"; weekdays as Feria II–VI) |
| Pontifical universities | Seal with a Latin legend, a programme of study in a syllabus table (Lectio I–X, topic, length), details tables, sober forms |

- **Type**: EB Garamond for headings and small-caps labels, Source Serif 4 for reading text and conciliar quotations, Cinzel only for the wordmark and Latin document titles, Inter for interface text.
- **Colour**: paper white, ink, rubric red `#7A1F1F` and gold `#A88A4A`.
- **Form**: square corners, hairlines instead of shadows, no gradients.
- **Seal**: the app's own seal, an open book under a cross inside a ring with the legend *STVDIVM · CONCILII · VATICANI · II · MCMLXII · MCMLXV*. It deliberately avoids the keys, tiara and arms of the Holy See.
- **Footer**: a colophon stating that this is an unofficial study edition without ecclesiastical approval (imprimatur).

Key screens:

- **Home** (title page)
  - Overline, title and a double rule.
  - *Ex Concilio · Text of the day*: a paragraph with its rubric number and Latin incipit.
  - Search form.
  - Programme of study (syllabus table).
  - The latest general-audience catecheses.
  - *Index documentorum*.
  - Study paths, Claim Check, video lectures and further study.
- **Lesson**
  - Breadcrumbs and a *Lectio V* overline.
  - A details table (length, texts, knowledge check).
  - Underlined material tabs (texts / videos / catecheses).
  - Numbered sections with a red initial.
  - A progress box and the course index in the margin.
- **Catecheses**: a register of the audiences, newest first, grouped by month, with constitution tabs. `#YYYY-MM-DD` links highlight the day.
- **Document reader**: a title page after the official conciliar editions.
  - It opens with the heading formula *Paulus Episcopus, Servus Servorum Dei, una cum Sacrosancti Concilii Patribus, ad perpetuam rei memoriam*, then the Latin designation in red, the title in capitals, the vernacular title and the promulgation line.
  - A details strip shows the date, the session (II–IV), the final vote and the paragraphs.
  - An *Index* in the margin lists the chapters (*Caput I*, …).
  - Chapter headings in the text are centred, in the manner of the *Acta Apostolicae Sedis*.
  - Text tagged `lang="la"` is set by EB Garamond's Latin locale rules, which give the classical V for U in capitals (CAPVT, CONSTITVTIO).

The tabs implement the WAI-ARIA tabs pattern. On desktop the masthead and a small-caps navigation row sit under a dark utility bar. On mobile there is a fixed five-tab bar.

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
2. **Five tabs.** The mobile tab bar has five tabs (Home, Learn, Documents, Claims, Search) instead of four.
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
8. **Videos are the one opt-in network exception.** The brief forbids external calls at runtime. Videos use a click-to-load facade: nothing is requested from YouTube until the reader presses play, and the embed uses youtube-nocookie.com. Offline, the card says so. Video IDs could not be opened from the build environment (YouTube is blocked there), so they were checked against search results; uploaders that search could not confirm are labelled "channel not confirmed".
9. **Knowledge checks** are factual (dates, what a paragraph says), never a test of personal orthodoxy, which stays out of scope.
7. **Font precache** is limited to the Latin and Latin-ext subsets. Other subsets
   are never requested for Dutch, English or Latin text.

## Acceptance checks

Verified locally with headless Chromium against `vite preview`:

- service worker installs and controls the page; with the network **offline**,
  every route, the LG reader, the paragraph sheet and search all work;
- **zero** external requests and zero failed requests after install;
- no horizontal scroll at **320 px** on any route;
- `tsc --noEmit` is clean under `strict` (+ `noUncheckedIndexedAccess`);
- video theater: an "ended" event removes the player and shows the end card; a spoofed message from another origin is ignored; the "watched" mark persists;
- focus mode hides and restores the header; back navigation restores the scroll position.

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
