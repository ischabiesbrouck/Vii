# Concilium

*Studium Concilii Vaticani II*: a study edition of the sixteen documents of the
Second Vatican Council (1962–1965), organised by paragraph number. It is an
installable web app (PWA) that works offline, in Dutch with an English
translation. There is no backend, no account and no tracking. Once the service
worker is installed the app makes no network requests, except for videos the
reader chooses to play.

> Concilium is a study aid. It does not speak for the Church. The official texts
> are on [vatican.va](https://www.vatican.va/archive/hist_councils/ii_vatican_council/index.htm).

## Getting started

```bash
npm install
npm run dev        # validate content, then start Vite
npm run check      # typecheck, content validation and unit tests (as in CI)
npm run build      # check and production build with service worker
npm run preview    # serve dist/ to test installation and offline use
```

Any static host with a fallback to `index.html` will serve `dist/`. Fallback
config files are included for Netlify (`public/_redirects`) and Vercel
(`vercel.json`).

**GitHub Pages.** `.github/workflows/deploy-pages.yml` deploys every push to
`main` to `https://<owner>.github.io/<repo>/`, here
<https://ischabiesbrouck.github.io/Vii/>.
- One-time setup: Settings → Pages → Source: GitHub Actions.
- The build sets `BASE_PATH=/<repo>/` for the router, manifest and service worker.
- `404.html` handles deep links.

## Stack

React 18, TypeScript (strict), Vite 6 and Tailwind CSS 3, with Radix
primitives.

| Area | Libraries |
|---|---|
| Routing | react-router 6 |
| Offline and install | vite-plugin-pwa (Workbox) |
| Search | MiniSearch; the index is cached in IndexedDB via Dexie |
| State | Zustand, persisted in localStorage |
| Translation | i18next |
| Unit tests | Vitest |

Fonts are self-hosted through Fontsource: EB Garamond, Source Serif 4, Cinzel and Inter.

## What is in the app

| Route | Content |
|---|---|
| `/` | Title page with the text of the day, search, programme of study, latest audiences, *Index documentorum*, study paths, Claim Check, video lectures |
| `/documents`, `/documents/:id` | The sixteen documents; reader with title page, *Index*, red marginal paragraph numbers, paragraph sheet (cross-references, citation, bookmark), focus mode, reading progress |
| `/learn`, `/learn/:id` | Course of ten *lectiones* with key facts, texts, catecheses, videos, a factual knowledge check and sources |
| `/subjects`, `/subjects/:id` | Sixteen study paths: objectives, reading path, claims, terms, questions, further reading |
| `/subjects/:id/study/:chapter` | Study text per subject, in chapters (*Caput I–V*) with numbered sections, quotations, boxes, positions, figures and bibliography |
| `/catechesis`, `/catechesis/:id` | Twelve short catecheses, each headed by a question. Each has explanation, *In brief*, reflection questions and further reading. Nothing is quoted directly; references such as LG §8 are links that open the paragraph in a panel |
| `/catecheses` | Register of Pope Leo XIV's general audiences on the Council (2026), with links to vatican.va |
| `/videos` | Selected English-language videos; played in the app, with no YouTube suggestions afterwards |
| `/claims`, `/timeline`, `/glossary`, `/hermeneutics`, `/search`, `/about` | Claim Check, chronology, terms, readings of the Council, full-text search, colophon |

## Content

All content is static JSON in `public/content/`. The service worker precaches
it, and nothing is generated at runtime.

| File | Contents |
|---|---|
| `documents.json` | Metadata for the sixteen documents: dates, votes, Latin designation, summary, chapter outline |
| `{docId}.json` | Paragraph excerpts (125 in total), with a Dutch working translation and Latin |
| `studies/{subjectId}.json` | Sixteen study texts (about 38,500 words per language) |
| `catechesis/{id}.json` | Twelve short catecheses (800–1,100 words per language); the validator rejects any quoted passage of more than six words |
| `subjects.json`, `lessons.json` | Study paths and course |
| `claims.json`, `glossary.json`, `hermeneutics.json`, `timeline.json` | Claim Check, terms, readings, chronology |
| `catecheses.json`, `videos.json` | Audiences and videos, with their sources |
| `sources.json` | External sources, cited as `ext:…` |
| `images.json` | 23 licensed images from Wikimedia Commons (public domain, CC0, CC BY, CC BY-SA): author, licence, source |

`scripts/validate-content.mjs` runs before every build. It checks that every
citation, cross-reference, quotation and source resolves. Citations in study
texts must fall within each document's paragraph count, and every position in a
dispute must name its sources. The script also writes `index.json`, whose hash
invalidates the cached search index.

### Adding content

- **A document:** add `public/content/{docId}.json` following `DocumentContent`
  in `src/types/content.ts`, with paragraph ids such as `CD-11`. No code change
  is needed.
- **A study text:** follow the `Study` type. Conciliar text only appears through
  `quote` blocks, so excerpts are never retyped.
- **Photos:** go in `public/images/` with an entry in `images.json`. The caption
  shows author, licence and source, and the validator checks that each file exists.
  `.github/workflows/images.yml` fetches them from Wikimedia Commons on GitHub's
  runners, in two phases:
  1. Edit `tools/images/queries.json` and push. The workflow searches Commons and
     commits 480 px previews and their metadata to `tools/images/candidates/`. Only
     public domain, CC0, CC BY and CC BY-SA files are kept; NC, ND and GFDL-only are
     rejected.
  2. Choose files in `tools/images/selection.json` (`id`, Commons `title`, alt text in
     both languages, optional `author` correction) and push. The workflow checks the
     licence again, downloads the files to `public/images/` and writes `images.json`.

  Then reduce the files locally (the current set uses at most 1000 × 1400 px, JPEG
  quality 80), make a 640 px copy in `public/images/640/` for phones (the validator
  checks it exists), and delete `tools/images/candidates/` before merging.
  A subject's card and header photo is set with `imageId` (and optionally
  `imageFocus`, a CSS object-position) in `subjects.json`.

### Editorial status

The excerpts, working translations, summaries, study texts and Claim Checks were
**written with the help of AI and have not yet been checked line by line** against
vatican.va, the *Acta Synodalia* or the literature cited. The app says so on
every relevant page. Each file carries `"review": "unverified"` until an editor
has checked it.

Before publication as a reference work, an editor should check:
- the excerpts against the Latin and English texts;
- the vote figures;
- the bibliographic details;
- the theological wording of the study texts.

## Licensing

The conciliar texts and their translations are under copyright held by the
**Libreria Editrice Vaticana**, and for Dutch by the respective translators.
Without permission the app shows **excerpts per paragraph**, for study and
commentary, with links to vatican.va and rkdocumenten.nl. The Dutch texts are
the app's own working translations, not the official translation.

Use `CONTENT_MODE` in `src/config.ts` (`'excerpt' | 'full'`, or
`VITE_CONTENT_MODE=full`) only once written permission has been obtained.

## Editorial choices

- **Qualification of documents.** Only LG and DV are called *dogmatica* and GS
  *pastoralis* in the official Latin designation.
  - The others are marked "unqualified"; decrees are marked "disciplinary".
  - The app shows the full Latin designation, so no label of its own is presented as part of the title.
- **Disputed questions** (Claim Check, study texts, hermeneutics) show the
  positions side by side, each with sources. The app does not decide between them.
- **Knowledge checks** ask about facts: dates, and what a paragraph says. They
  never test personal orthodoxy.
- **Terms without a conciliar source**, such as *aggiornamento* and
  *ressourcement*, are labelled as such and do not link to a paragraph.
- **Images** are precached with the rest of the app (about 4 MB), so figures also
  appear offline. Captions state what the image shows and why it is there; each
  figure links to its Commons page and licence, as CC BY and CC BY-SA require.
- **Videos** are the only network traffic. Nothing loads before the reader
  presses play.
  - The player uses youtube-nocookie.com.
  - When the video ends, the app removes the player, so no suggestions or next video appear.
  - Uploaders that could not be confirmed are labelled as such.

## Design

The design follows the typographic conventions of the Holy See's publications
and of pontifical faculties, without using any official emblem.

| Source | Adopted |
|---|---|
| vatican.va | Document index by kind, Latin titles in capitals before the vernacular, language bar |
| *Acta Apostolicae Sedis*, conciliar editions | Serif type, small caps, centred chapter headings, paragraph numbers in red |
| Liturgical books | Rubrics and initials in red |
| Vatican News | Red section labels with a date line |
| Curial documents | Latin date line (*Dominica, die XVIII mensis Octobris, anno MMXXVI*) and the heading formula *Paulus Episcopus, Servus Servorum Dei…* |
| Pontifical universities | Seal with a Latin legend, syllabus tables, sober forms |
| Printed study editions | Photographs as numbered plates (*Tab. I*), with caption and credit |

**Typefaces:**
- EB Garamond for headings and small caps.
- Source Serif 4 for reading text.
- Cinzel only for the wordmark and Latin titles.
- Inter for interface text.

**Colours:** ink, rubric red (`#7A1F1F`) and gold (`#A88A4A`). Gold text uses `#6E5528` so that it meets WCAG AA.

**Seal:** the app's own, an open book under a cross, with no keys, tiara or arms of the Holy See.

**Latin text:** text marked `lang="la"` follows EB Garamond's Latin rules, which set U as V in capitals (*CAPVT*).

## Accessibility and quality

- **Accessibility**
  - WCAG 2.2 AA as the target.
  - Tabs follow the WAI-ARIA tabs pattern.
  - On a page change, focus moves to the content and the page title is announced.
  - Back navigation restores the scroll position.
  - No horizontal scrolling at 320 px.
- **Performance** (Lighthouse 13, simulated mobile / desktop, home page)
  - Desktop 97–99 on the main pages; mobile about 75; layout shift 0.
  - The masthead is static HTML in `index.html` and paints before the JavaScript.
  - The home title page renders without waiting for content; the text of the day
    loads one document, not all sixteen.
  - The search engine, the command palette and the video player load on first use;
    other page chunks and the search index are warmed a few seconds after load.
  - The Latin subsets of the four typefaces are preloaded (a small Vite plugin).
  - Photos are served from `srcset` (640 px or full) with fixed dimensions.
- **Automated checks**
  - `ci.yml` runs `npm run check` and a production build on every pull request.
  - The Pages workflow runs the tests before every deployment.
- **Manual checks before a release**
  - Offline use with the network switched off.
  - No external requests after installation.
  - The video ending.
  - Phone widths.
- **Not yet done:** testing on physical iOS and Android devices.

## Not in scope

Accounts, comments, chat, push notifications, donations, orthodoxy tests, and
anything that suggests the app speaks for the Church.

## Literature

- Alberigo, G., & Komonchak, J. A. (Eds.). (1995–2006). *History of Vatican II* (Vols. 1–5). Orbis Books.
- Benedict XVI. (2005, December 22). *Address to the Roman Curia offering them his Christmas greetings*. Libreria Editrice Vaticana.
- Lamb, M. L., & Levering, M. (Eds.). (2008). *Vatican II: Renewal within tradition*. Oxford University Press.
- O'Malley, J. W. (2008). *What happened at Vatican II*. Belknap Press of Harvard University Press.
- Tanner, N. P. (Ed.). (1990). *Decrees of the ecumenical councils* (Vol. 2). Georgetown University Press.
