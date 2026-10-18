import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookmarkCheck, ExternalLink, Info, Star } from 'lucide-react';
import { DocTypeBadge, SolemnityBadge } from '@/components/Badges';
import { Commentary, ConciliarText, CiteLink, Loading } from '@/components/TextBlocks';
import { ParagraphSheet, copyCitation } from '@/components/ParagraphSheet';
import { getDocument, getDocumentContent } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, formatDate, pick } from '@/lib/utils';
import { CONTENT_MODE, RKDOCUMENTEN_URL } from '@/config';
import { useUi, type FontSize } from '@/store/ui';
import type { CouncilDocument, Paragraph } from '@/types/content';

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
    <article className="relative" aria-labelledby={`${p.id}-label`}>
      <div className="mb-1 flex items-center gap-2">
        <a id={p.id} href={`#${p.id}`} className="block scroll-mt-36 font-sans text-sm font-semibold text-accent">
          <span id={`${p.id}-label`}>§{p.number}</span>
        </a>
        {isKey && <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label={t('doc.keyParagraphs')} />}
        {isBookmarked && <BookmarkCheck className="h-3.5 w-3.5 text-accent" aria-label={t('para.bookmark')} />}
        {(p.noteNl || p.noteEn) && <Info className="h-3.5 w-3.5 text-gold-text" aria-label={t('commentary')} />}
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`${doc.abbr} §${p.number}`}
        className="no-callout cursor-pointer rounded-md transition-shadow hover:shadow-sm"
        {...handlers}
      >
        <ConciliarText paragraph={p} cite={`${doc.abbr} §${p.number}`} />
      </div>
    </article>
  );
}

const popeNl = { 'Paul VI': 'Paulus VI', 'John XXIII': 'Johannes XXIII' } as const;

const sizes: { value: FontSize; label: string }[] = [
  { value: 'sm', label: 'A' },
  { value: 'md', label: 'A+' },
  { value: 'lg', label: 'A++' },
];

export function DocumentReader() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const { fontSize, setFontSize, bookmarks, progress, recordProgress } = useUi();
  const docState = useAsync(() => getDocument(id), [id]);
  const contentState = useAsync(() => getDocumentContent(id), [id]);
  const doc = docState.data;
  const content = contentState.data;
  const [active, setActive] = useState<Paragraph | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [liveFraction, setLiveFraction] = useState(0);

  useDocumentTitle(doc ? `${doc.abbr} · ${doc.titleLa}` : undefined);

  const paragraphs = useMemo(() => [...(content?.paragraphs ?? [])].sort((a, b) => a.number - b.number), [content]);

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
    recordProgress(id, fraction, current);
  }, [id, paragraphs, recordProgress]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const now = Date.now();
        if (now - last > 250) {
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

  if (docState.loading) return <Loading />;
  if (!doc) return <p className="py-8 text-center">{t('doc.notFound')}</p>;

  const stored = progress[id]?.fraction ?? 0;
  const shown = Math.max(stored, liveFraction);
  const summary = pick(lang, doc.summaryNl, doc.summaryEn);

  return (
    <div>
      <header className="mb-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <DocTypeBadge type={doc.type} />
          <SolemnityBadge solemnity={doc.solemnity} />
          <span className="text-xs font-semibold leading-6 text-gold-text">{doc.abbr}</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight">
          <span lang="la">{doc.titleLa}</span>
        </h1>
        <p className="mt-1 text-lg">{pick(lang, doc.titleNl, doc.titleEn)}</p>
        <p lang="la" className="mt-1 text-sm text-muted">
          {doc.designationLa}
        </p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gold-text">{t('doc.promulgated')}</dt>
          <dd>
            {formatDate(doc.promulgated, lang)} {t('doc.by')} {lang === 'nl' ? popeNl[doc.promulgatedBy] : doc.promulgatedBy}
          </dd>
          {doc.voteFor !== null && (
            <>
              <dt className="text-gold-text">{t('doc.votes')}</dt>
              <dd>
                {doc.voteFor.toLocaleString(lang)} <span lang="la">{t('doc.placet')}</span> · {doc.voteAgainst?.toLocaleString(lang)}{' '}
                <span lang="la">{t('doc.nonPlacet')}</span>
              </dd>
            </>
          )}
          <dt className="text-gold-text">§</dt>
          <dd>{t('doc.paragraphs', { count: doc.paragraphCount })}</dd>
        </dl>
        <Commentary className="mt-4" label={`${t('commentary')} · ${t('doc.summary')}`}>
          {summary}
        </Commentary>
        {doc.keyParagraphs.length > 0 && (
          <p className="mt-3 text-sm">
            <span className="text-gold-text">{t('doc.keyParagraphs')}: </span>
            {doc.keyParagraphs.map((k, i) => (
              <span key={k}>
                {i > 0 && ', '}
                <CiteLink id={k} />
              </span>
            ))}
          </p>
        )}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li>
            <a href={doc.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-accent underline underline-offset-2">
              {t('doc.official')}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </li>
          <li>
            <a href={doc.officialUrlLa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-accent underline underline-offset-2">
              {t('doc.officialLa')}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </li>
          {lang === 'nl' && (
            <li>
              <a href={RKDOCUMENTEN_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 text-accent underline underline-offset-2">
                {t('doc.officialNl')}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          )}
        </ul>
      </header>

      {contentState.loading ? (
        <Loading />
      ) : !content ? (
        // TODO(content): add public/content/{docId}.json to enable the reader for this document.
        <Commentary>{t('doc.notSeeded')}</Commentary>
      ) : (
        <>
          <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mb-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only sm:not-sr-only">{t('doc.jump')}</span>
                <select
                  className="min-h-[40px] rounded-md border border-line bg-card px-2 text-sm"
                  value=""
                  aria-label={t('doc.jump')}
                  onChange={(e) => e.target.value && navigate({ hash: e.target.value }, { replace: true })}
                >
                  <option value="">§ …</option>
                  {paragraphs.map((p) => (
                    <option key={p.id} value={p.id}>
                      §{p.number}
                    </option>
                  ))}
                </select>
              </label>
              <div className="ml-auto flex rounded-md border border-line bg-card p-0.5" role="group" aria-label={t('settings.fontSize')}>
                {sizes.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={fontSize === s.value}
                    onClick={() => setFontSize(s.value)}
                    className={cn('min-h-[36px] min-w-[40px] rounded px-2 text-sm', fontSize === s.value ? 'bg-accent text-accent-fg' : 'hover:bg-surface')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={t('doc.progress')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(shown * 100)}
            >
              <div className="h-full bg-accent transition-[width]" style={{ width: `${shown * 100}%` }} />
            </div>
          </div>

          {CONTENT_MODE === 'excerpt' && (
            <Commentary className="mb-3">
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
          <p className="mb-4 text-xs text-muted">{t('doc.tapHint')}</p>

          <div ref={listRef} className={cn('mx-auto max-w-prose space-y-5', `reader-${fontSize}`)}>
            {paragraphs.map((p) => (
              <ReaderParagraph
                key={p.id}
                p={p}
                doc={doc}
                isKey={doc.keyParagraphs.includes(p.id)}
                isBookmarked={bookmarks.includes(p.id)}
                onOpen={(para) => {
                  setActive(para);
                  setSheetOpen(true);
                }}
              />
            ))}
          </div>
          <p className="mt-8 text-center text-sm">
            <Link to="/documents" className="text-accent underline underline-offset-2">
              {t('doc.all')}
            </Link>
          </p>
          <ParagraphSheet paragraph={active} doc={doc} open={sheetOpen} onOpenChange={setSheetOpen} />
        </>
      )}
    </div>
  );
}
