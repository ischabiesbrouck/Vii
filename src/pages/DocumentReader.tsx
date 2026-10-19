import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, BookmarkCheck, ExternalLink, Info, ListTree, Maximize2, Minimize2, MoreHorizontal, Star } from 'lucide-react';
import { useFocusMode } from '@/store/focus';
import { DocTypeBadge, SolemnityBadge } from '@/components/Badges';
import { Commentary, ConciliarText, CiteLink, Crumbs, Loading, ProgressBar } from '@/components/TextBlocks';
import { ParagraphSheet, copyCitation } from '@/components/ParagraphSheet';
import { ReadAloudButton } from '@/components/ReadAloud';
import { SubjectIcon } from '@/components/SubjectIcon';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { getCatecheses, getDocumentContent, getDocuments, getSubjects, getVideos } from '@/lib/content';
import { VideoRow } from '@/components/VideoCard';
import { toRoman } from '@/lib/roman';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, formatDate, pick } from '@/lib/utils';
import { CONTENT_MODE, RKDOCUMENTEN_URL } from '@/config';
import { useUi, type FontSize } from '@/store/ui';
import type { CouncilDocument, OutlineSection, Paragraph } from '@/types/content';

function useLongPress(onLong: () => void, onTap: () => void, ms = 550) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const clear = () => {
    window.clearTimeout(timer.current);
    origin.current = null;
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        navigator.vibrate?.(15);
        onLong();
      }, ms);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const o = origin.current;
      if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > 10) clear();
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.MouseEvent) => {
      if (fired.current) e.preventDefault();
    },
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      if (window.getSelection()?.toString()) return; // user is selecting text
      onTap();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTap();
      }
    },
  };
}

function ReaderParagraph({
  p,
  doc,
  isKey,
  isBookmarked,
  onOpen,
}: {
  p: Paragraph;
  doc: CouncilDocument;
  isKey: boolean;
  isBookmarked: boolean;
  onOpen: (p: Paragraph) => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const handlers = useLongPress(
    () => void copyCitation(p, doc, lang, t('para.copied')),
    () => onOpen(p),
  );
  return (
    <article className="grid gap-x-4 sm:grid-cols-[3.25rem_minmax(0,1fr)]" aria-labelledby={`${p.id}-label`}>
      {/* Rubric: the paragraph number in red, in the margin, as in liturgical and conciliar editions. */}
      <div className="mb-1 flex items-center gap-2 sm:mb-0 sm:flex-col sm:items-end sm:gap-1 sm:pt-3">
        <a id={p.id} href={`#${p.id}`} className="block scroll-mt-40 font-serif text-lg font-semibold leading-none text-accent">
          <span id={`${p.id}-label`}>
            <span className="text-[0.8em] opacity-80">§</span>
            {p.number}
          </span>
        </a>
        {isKey && <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label={t('doc.keyParagraphs')} />}
        {isBookmarked && <BookmarkCheck className="h-3.5 w-3.5 text-accent" aria-label={t('para.bookmark')} />}
        {(p.noteNl || p.noteEn) && <Info className="h-3.5 w-3.5 text-gold-text" aria-label={t('commentary')} />}
        <button
          type="button"
          onClick={() => onOpen(p)}
          aria-haspopup="dialog"
          aria-label={`${t('para.actions')}: ${doc.abbr} §${p.number}`}
          title={t('para.actions')}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-fg sm:ml-0"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {/* Tapping the text opens the same panel; long-press copies the citation. Keyboard users use the button above. */}
      <div className="no-callout cursor-pointer transition-shadow hover:shadow-[0_0_0_1px_rgb(var(--gold))]" {...handlers}>
        <ConciliarText paragraph={p} cite={`${doc.abbr} §${p.number}`} />
      </div>
    </article>
  );
}

function sectionOf(outline: OutlineSection[] | undefined, n: number) {
  return outline?.find((o) => n >= o.from && n <= o.to);
}

function Outline({
  doc,
  paragraphs,
  currentId,
  onPick,
}: {
  doc: CouncilDocument;
  paragraphs: Paragraph[];
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const current = paragraphs.find((p) => p.id === currentId);
  if (!doc.outline) {
    return (
      <ul className="grid grid-cols-5 gap-1 text-sm">
        {paragraphs.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onPick(p.id)} className={cn('min-h-[36px] w-full rounded-sm hover:bg-surface', p.id === currentId && 'bg-surface font-semibold text-accent')}>
              §{p.number}
            </button>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="border-l border-line">
      {doc.outline.map((o) => {
        const inSection = paragraphs.filter((p) => p.number >= o.from && p.number <= o.to);
        const active = current && current.number >= o.from && current.number <= o.to;
        return (
          <li key={o.labelLa}>
            <button
              type="button"
              disabled={!inSection.length}
              onClick={() => inSection[0] && onPick(inSection[0].id)}
              className={cn(
                '-ml-px w-full border-l-2 py-1.5 pl-3 pr-1 text-left transition-colors disabled:cursor-default',
                active ? 'border-accent bg-surface' : 'border-transparent enabled:hover:border-gold',
              )}
            >
              <span className={cn('block font-title text-[0.95rem] small-caps', active ? 'text-accent' : 'text-gold-text')}>
                {o.labelLa} · §{o.from}
                {o.to !== o.from && `–${o.to}`}
              </span>
              <span className={cn('block font-serif text-[0.86rem] leading-snug', inSection.length ? 'text-fg' : 'text-muted')}>{pick(lang, o.titleNl, o.titleEn)}</span>
              <span className="block text-[0.7rem] text-muted">
                {inSection.length ? t('doc.excerptCount', { count: inSection.length }) : t('doc.noneSeededInSection')}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

const sizes: { value: FontSize; label: string }[] = [
  { value: 'sm', label: 'A' },
  { value: 'md', label: 'A+' },
  { value: 'lg', label: 'A++' },
];

const popeNl = { 'Paul VI': 'Paulus VI', 'John XXIII': 'Johannes XXIII' } as const;

/** Conciliar period in which a document was promulgated: 1963 → II, 1964 → III, 1965 → IV. */
const sessionOf = (iso: string) => {
  const n = { '1963': 2, '1964': 3, '1965': 4 }[iso.slice(0, 4)];
  return n ? toRoman(n) : '—';
};

export function DocumentReader() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { fontSize, setFontSize, bookmarks, progress, recordProgress } = useUi();
  const { data, loading } = useAsync(async () => {
    const [docs, content, subjects, cat, videos] = await Promise.all([getDocuments(), getDocumentContent(id), getSubjects(), getCatecheses(), getVideos()]);
    const ordered = [...docs].sort((a, b) => a.promulgated.localeCompare(b.promulgated) || a.titleLa.localeCompare(b.titleLa));
    const i = ordered.findIndex((d) => d.id === id);
    const doc = ordered[i];
    if (!doc) return null;
    const related = subjects.filter((s) => s.steps.some((st) => st.paragraphId.startsWith(`${doc.abbr}-`)));
    const catecheses = cat.items.filter((c) => c.docId === doc.id);
    const docVideos = videos.items.filter((v) => v.docIds.includes(doc.id));
    return { doc, content, prev: ordered[i - 1], next: ordered[i + 1], related, catecheses, docVideos };
  }, [id]);
  const doc = data?.doc;
  const content = data?.content;
  const [active, setActive] = useState<Paragraph | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focus = useFocusMode((s) => s.on);
  const setFocus = useFocusMode((s) => s.set);

  // Leave focus mode on Esc and whenever the reader unmounts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useFocusMode.getState().set(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      useFocusMode.getState().set(false);
    };
  }, []);
  const [liveFraction, setLiveFraction] = useState(0);

  useDocumentTitle(doc ? `${doc.abbr} · ${doc.titleLa}` : undefined);

  const paragraphs = useMemo(() => [...(content?.paragraphs ?? [])].sort((a, b) => a.number - b.number), [content]);

  const goTo = useCallback((pid: string) => {
    setTocOpen(false);
    navigate({ hash: pid }, { replace: true });
  }, [navigate]);

  // Scroll to #LG-8 once content is rendered, and on later hash changes.
  useEffect(() => {
    setSheetOpen(false);
    if (!location.hash || !paragraphs.length) return;
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  }, [location.hash, paragraphs.length]);

  // Reading progress: furthest fraction + current paragraph, persisted locally.
  const onScroll = useCallback(() => {
    const list = listRef.current;
    if (!list || !paragraphs.length) return;
    const rect = list.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / rect.height));
    setLiveFraction(fraction);
    let current: string | null = null;
    for (const p of paragraphs) {
      const a = document.getElementById(p.id);
      if (a && a.getBoundingClientRect().top < window.innerHeight * 0.4) current = p.id;
    }
    setCurrentId(current);
    recordProgress(id, fraction, current);
  }, [id, paragraphs, recordProgress]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const now = Date.now();
        if (now - last > 200) {
          last = now;
          onScroll();
        }
      });
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => {
      window.removeEventListener('scroll', handler);
      cancelAnimationFrame(raf);
    };
  }, [onScroll]);

  if (loading) return <Loading />;
  if (!doc || !data) return <p className="py-8 text-center">{t('doc.notFound')}</p>;

  const stored = progress[id]?.fraction ?? 0;
  const shown = Math.max(stored, liveFraction);
  const total = (doc.voteFor ?? 0) + (doc.voteAgainst ?? 0);
  const linkCls = 'flex min-h-[42px] items-center justify-between gap-2 py-2 text-accent hover:underline';

  return (
    <div>
      <Crumbs items={[{ to: '/', label: t('crumbs.home') }, { to: '/documents', label: t('nav.documents') }, { label: doc.titleLa }]} />

      {/* Title page, after the official conciliar editions */}
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <p className="kicker">Concilium Oecumenicum Vaticanum II</p>
        {doc.promulgatedBy === 'Paul VI' && (
          <p lang="la" className="mx-auto mt-5 max-w-xl font-title text-[0.98rem] leading-relaxed text-muted small-caps">
            Paulus Episcopus, Servus Servorum Dei, una cum Sacrosancti Concilii Patribus, ad perpetuam rei memoriam
          </p>
        )}
        <div className="rule-ornament mx-auto mt-6 max-w-xs" aria-hidden>
          <span className="text-[0.55rem]">◆</span>
        </div>
        <p lang="la" className="mt-6 font-title text-[1.05rem] uppercase tracking-[0.14em] text-accent">
          {doc.designationLa}
        </p>
        <h1 className="display-title mt-3 text-[2.3rem] leading-[1.08] sm:text-[3.4rem]">
          <span lang="la">{doc.titleLa}</span>
        </h1>
        <p className="mt-3 font-title text-[1.35rem] italic">{pick(lang, doc.titleNl, doc.titleEn)}</p>
        <p className="mt-4 text-sm text-muted">
          {t('doc.promulgatedOn', { pope: lang === 'nl' ? popeNl[doc.promulgatedBy] : doc.promulgatedBy, date: formatDate(doc.promulgated, lang) })}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <DocTypeBadge type={doc.type} />
          <SolemnityBadge solemnity={doc.solemnity} />
        </div>
      </header>

      <dl className="mb-8 grid grid-cols-2 border-y border-fg/70 text-sm sm:grid-cols-4">
        <div className="border-b border-line p-3 sm:border-b-0 sm:pl-0">
          <dt className="kicker">{t('doc.promulgated')}</dt>
          <dd className="mt-0.5 tabular">{formatDate(doc.promulgated, lang)}</dd>
        </div>
        <div className="border-b border-l border-line p-3 sm:border-b-0">
          <dt className="kicker">{t('doc.session')}</dt>
          <dd className="mt-0.5">{sessionOf(doc.promulgated)}</dd>
        </div>
        <div className="p-3 sm:border-l sm:border-line">
          <dt className="kicker">{t('doc.votes')}</dt>
          <dd className="mt-0.5 tabular">
            {doc.voteFor !== null && doc.voteAgainst !== null ? (
              <>
                <span className="flex h-1 overflow-hidden bg-line" aria-hidden>
                  <span className="bg-gold" style={{ width: `${(doc.voteFor / total) * 100}%` }} />
                  <span className="bg-accent" style={{ width: `${(doc.voteAgainst / total) * 100}%`, minWidth: 2 }} />
                </span>
                <span className="mt-1 flex flex-wrap gap-x-2">
                  <span className="whitespace-nowrap">
                    {doc.voteFor.toLocaleString(lang)} <span lang="la" className="la text-muted">{t('doc.placet')}</span>
                  </span>
                  <span className="whitespace-nowrap">
                    {doc.voteAgainst.toLocaleString(lang)} <span lang="la" className="la text-muted">{t('doc.nonPlacet')}</span>
                  </span>
                </span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="border-l border-line p-3">
          <dt className="kicker">{t('doc.paragraphsLabel')}</dt>
          <dd className="mt-0.5 tabular">
            {doc.paragraphCount} · {content ? t('doc.excerptCount', { count: paragraphs.length }) : t('doc.metadataOnly')}
          </dd>
        </div>
      </dl>

      <div className="mb-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div>
          <Commentary label={`${t('commentary')} · ${t('doc.summary')}`}>
            <p className="leading-relaxed">{pick(lang, doc.summaryNl, doc.summaryEn)}</p>
          </Commentary>
          {doc.keyParagraphs.length > 0 && (
            <p className="mt-4 text-sm">
              <span className="kicker mr-2">{t('doc.keyParagraphs')}</span>
              {doc.keyParagraphs.map((k, i) => (
                <span key={k}>
                  {i > 0 && ', '}
                  <CiteLink id={k} />
                </span>
              ))}
            </p>
          )}
        </div>
        <div>
          <p className="kicker mb-1.5">{t('footer.sources')}</p>
          <ul className="divide-y divide-line border-y border-line text-sm">
            <li>
              <a href={doc.officialUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                {t('doc.official')} <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              </a>
            </li>
            <li>
              <a href={doc.officialUrlLa} target="_blank" rel="noopener noreferrer" className={linkCls}>
                {t('doc.officialLa')} <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              </a>
            </li>
            {lang === 'nl' && (
              <li>
                <a href={RKDOCUMENTEN_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  rkdocumenten.nl <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mb-10" aria-label={t('doc.inSubjects')}>
          <p className="kicker mb-2">{t('doc.inSubjects')}</p>
          <ul className="flex flex-wrap gap-2">
            {data.related.map((s) => (
              <li key={s.id}>
                <Link to={`/subjects/${s.id}`} className="chip whitespace-normal py-1.5 text-left">
                  <SubjectIcon name={s.icon} className="h-4 w-4 text-gold-text" />
                  {pick(lang, s.titleNl, s.titleEn)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(data.catecheses.length > 0 || data.docVideos.length > 0) && (
        <section className="mb-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2" aria-label={t('learn.explore')}>
          {data.catecheses.length > 0 && (
            <div>
              <p className="kicker mb-2">{t('learn.catecheses')}</p>
              <ol className="divide-y divide-line border-y border-line">
                {data.catecheses.map((c) => (
                  <li key={c.date}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="group flex items-baseline gap-3 py-2.5">
                      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-[0.08em] tabular text-accent">{formatDate(c.date, lang).replace(/ \d{4}$/, '')}</span>
                      <span className="flex-1 font-serif text-[0.95rem] group-hover:text-accent group-hover:underline">{pick(lang, c.titleNl, c.titleEn)}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted" aria-hidden />
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {data.docVideos.length > 0 && (
            <div>
              <p className="kicker mb-2">{t('video.title')}</p>
              <ul className="divide-y divide-line border-y border-line">
                {data.docVideos.slice(0, 4).map((v) => (
                  <li key={v.youtubeId}>
                    <VideoRow video={v} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {!content ? (
        <Commentary>{t('doc.notSeeded')}</Commentary>
      ) : (
        <div className={focus ? 'mx-auto max-w-[50rem]' : 'grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]'}>
          {/* Table of contents (desktop) */}
          <aside data-chrome className="hidden lg:block" aria-label={t('doc.contents')}>
            <div className="sticky top-16 max-h-[calc(100dvh-5rem)] overflow-y-auto pr-1">
              <p className="mb-3 font-title text-[1.15rem] font-medium">Index</p>
              <Outline doc={doc} paragraphs={paragraphs} currentId={currentId} onPick={goTo} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Toolbar */}
            <div className="reader-toolbar sticky top-[calc(4rem+4px+env(safe-area-inset-top))] z-20 -mx-4 mb-6 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur lg:top-0 lg:mx-0 lg:px-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label={t('doc.contents')}
                  onClick={() => setTocOpen(true)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-line bg-card px-3 text-sm hover:border-fg/40 lg:hidden"
                >
                  <ListTree className="h-4 w-4" aria-hidden />
                  <span className="hidden min-[400px]:inline">{t('doc.contents')}</span>
                </button>
                <label className="flex items-center gap-2 text-sm">
                  <span className="sr-only">{t('doc.jump')}</span>
                  <select
                    className="min-h-[40px] rounded-sm border border-line bg-card px-2 text-sm"
                    value=""
                    aria-label={t('doc.jump')}
                    onChange={(e) => e.target.value && goTo(e.target.value)}
                  >
                    <option value="">§ …</option>
                    {paragraphs.map((p) => (
                      <option key={p.id} value={p.id}>
                        §{p.number}
                      </option>
                    ))}
                  </select>
                </label>
                <ReadAloudButton target={listRef} className="min-h-[40px]" />
                <button
                  type="button"
                  onClick={() => setFocus(!focus)}
                  aria-pressed={focus}
                  title={focus ? t('doc.focusExit') : t('doc.focus')}
                  className="ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-line bg-card px-3 text-sm hover:border-fg/40"
                >
                  {focus ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
                  <span className="hidden sm:inline">{focus ? t('doc.focusExit') : t('doc.focus')}</span>
                </button>
                <div className="flex rounded-sm border border-line bg-card p-0.5" role="group" aria-label={t('settings.fontSize')}>
                  {sizes.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={fontSize === s.value}
                      onClick={() => setFontSize(s.value)}
                      className={cn('min-h-[36px] min-w-[40px] rounded-sm px-2 text-sm', fontSize === s.value ? 'bg-primary text-primary-fg' : 'hover:bg-surface')}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <ProgressBar value={shown} label={t('doc.progress')} className="mt-2" />
            </div>

            {CONTENT_MODE === 'excerpt' && (
              <Commentary className="mb-4">
                <p>{t('doc.excerptMode')}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    {t('doc.source')}
                    {content.review === 'unverified' && ` · ${t('doc.unverified')}`}
                  </summary>
                  <p className="mt-1 text-muted">{pick(lang, content.sourceNl, content.sourceEn)}</p>
                </details>
              </Commentary>
            )}
            <p className="mb-8 text-xs text-muted" data-tts-skip>
              {t('doc.tapHint')}
            </p>

            <div ref={listRef} className={cn('max-w-[46rem] space-y-6', `reader-${fontSize}`)}>
              {paragraphs.map((p, i) => {
                const sec = sectionOf(doc.outline, p.number);
                const prevSec = i > 0 ? sectionOf(doc.outline, paragraphs[i - 1]!.number) : undefined;
                return (
                  <div key={p.id}>
                    {sec && sec !== prevSec && (
                      <div className={cn('mb-8 text-center sm:pl-[4.25rem]', i > 0 && 'pt-8')}>
                        <p lang="la" className="font-title text-[1.05rem] uppercase tracking-[0.18em] text-accent">
                          {sec.labelLa}
                        </p>
                        <h2 className="mx-auto mt-1 max-w-lg font-title text-[1.45rem] font-medium italic leading-snug">{pick(lang, sec.titleNl, sec.titleEn)}</h2>
                        <div className="rule-ornament mx-auto mt-4 max-w-[10rem]" aria-hidden>
                          <span className="text-[0.45rem]">◆</span>
                        </div>
                      </div>
                    )}
                    <ReaderParagraph
                      p={p}
                      doc={doc}
                      isKey={doc.keyParagraphs.includes(p.id)}
                      isBookmarked={bookmarks.includes(p.id)}
                      onOpen={(para) => {
                        setActive(para);
                        setSheetOpen(true);
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <ParagraphSheet paragraph={active} doc={doc} open={sheetOpen} onOpenChange={setSheetOpen} />
            <Sheet open={tocOpen} onOpenChange={setTocOpen}>
              <SheetContent title={t('doc.contents')} description={doc.titleLa} closeLabel={t('app.close')}>
                <Outline doc={doc} paragraphs={paragraphs} currentId={currentId} onPick={goTo} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      <nav aria-label={t('nav.documents')} className="mt-14 grid gap-3 border-t border-fg/70 pt-6 sm:grid-cols-2">
        {data.prev ? (
          <Link to={`/documents/${data.prev.id}`} className="panel-link p-4">
            <span className="kicker inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" aria-hidden /> {t('doc.prev')}
            </span>
            <span className="display-title mt-1 block text-base" lang="la">
              {data.prev.titleLa}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {data.next && (
          <Link to={`/documents/${data.next.id}`} className="panel-link p-4 text-right">
            <span className="kicker inline-flex items-center gap-1">
              {t('doc.next')} <ArrowRight className="h-3 w-3" aria-hidden />
            </span>
            <span className="display-title mt-1 block text-base" lang="la">
              {data.next.titleLa}
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}
