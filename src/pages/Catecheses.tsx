import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ExternalLink, PlayCircle } from 'lucide-react';
import { CiteLink, Commentary, Loading, PageHeader } from '@/components/TextBlocks';
import { getCatecheses } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, formatDate, pick } from '@/lib/utils';
import type { Catechesis } from '@/types/content';

const parts: Catechesis['part'][] = ['intro', 'DV', 'LG', 'SC', 'GS'];

/** Each constitution gets one soft tint, used consistently on its cards. */
const tint: Record<Catechesis['part'], { card: string; fg: string }> = {
  intro: { card: 'bg-card border border-line/70', fg: 'text-gold-text' },
  DV: { card: 'bg-sand', fg: 'text-sand-fg' },
  LG: { card: 'bg-violet', fg: 'text-violet-fg' },
  SC: { card: 'bg-rose', fg: 'text-rose-fg' },
  GS: { card: 'bg-sage', fg: 'text-sage-fg' },
};

const locale = (lang: 'nl' | 'en') => (lang === 'nl' ? 'nl-NL' : 'en-GB');
const at = (iso: string) => new Date(`${iso}T12:00:00`);
/** All ISO dates of a 'YYYY-MM' month. */
const monthDays = (ym: string) => {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`);
};
const monthLabel = (ym: string, lang: 'nl' | 'en') => at(`${ym}-01`).toLocaleDateString(locale(lang), { month: 'long', year: 'numeric' });

export function Catecheses() {
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const { data: series, loading } = useAsync(getCatecheses, []);
  useDocumentTitle(t('cat.title'));
  const [filter, setFilter] = useState<Catechesis['part'] | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const stripRef = useRef<HTMLUListElement>(null);

  const items = useMemo(() => (series ? [...series.items].sort((a, b) => a.date.localeCompare(b.date)) : []), [series]);
  const months = useMemo(() => [...new Set(items.map((c) => c.date.slice(0, 7)))], [items]);
  const todayIso = new Date().toISOString().slice(0, 10);

  // Initial month: the one in the URL hash, else the month of the latest catechesis to date.
  useEffect(() => {
    if (!items.length || month) return;
    const hash = decodeURIComponent(location.hash.slice(1));
    const fromHash = items.find((c) => c.date === hash);
    const latest = [...items].reverse().find((c) => c.date <= todayIso) ?? items[items.length - 1]!;
    const initial = fromHash ?? latest;
    setMonth(initial.date.slice(0, 7));
    setSelected(initial.date);
  }, [items, month, location.hash, todayIso]);

  useEffect(() => {
    if (!location.hash || !items.length) return;
    const id = decodeURIComponent(location.hash.slice(1));
    if (items.some((c) => c.date === id)) {
      setMonth(id.slice(0, 7));
      setSelected(id);
    }
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }));
  }, [location.hash, items]);

  // Keep the selected day in view inside the horizontal day strip (without moving the page).
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2 });
  }, [selected, month]);

  if (loading || !series || !month) return <Loading />;

  const shown = filter ? items.filter((c) => c.part === filter) : items;
  const inMonth = items.filter((c) => c.date.startsWith(month));
  const mi = months.indexOf(month);

  const goTo = (date: string) => {
    setSelected(date);
    const el = document.getElementById(date);
    el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  };
  const goMonth = (m: string) => {
    setMonth(m);
    const first = items.find((c) => c.date.startsWith(m));
    if (first) setSelected(first.date);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Leo PP. XIV · MMXXVI" title={pick(lang, series.seriesTitleNl, series.seriesTitleEn)} intro={pick(lang, series.introNl, series.introEn)}>
        <p className="mt-3 text-xs text-muted">
          {t('cat.count', { count: series.items.length })} · {t('cat.checked', { date: formatDate(series.checkedOn, lang) })}
        </p>
      </PageHeader>

      {/* Calendar navigator */}
      <section aria-label={t('cat.calendar')} className="panel mb-6 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] font-medium capitalize leading-none sm:text-[2rem]" aria-live="polite">
            {monthLabel(month, lang)}
          </h2>
          <div className="flex items-center gap-2">
            <button type="button" className="icon-btn disabled:opacity-40" onClick={() => goMonth(months[mi - 1]!)} disabled={mi <= 0} aria-label={t('cat.prevMonth')}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" className="icon-btn disabled:opacity-40" onClick={() => goMonth(months[mi + 1]!)} disabled={mi >= months.length - 1} aria-label={t('cat.nextMonth')}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
        <ul ref={stripRef} aria-label={t('cat.days', { month: monthLabel(month, lang) })} className="scroll-x relative mt-5 snap-x sm:mx-0 sm:px-0">
          {monthDays(month).map((iso) => {
            const d = at(iso);
            const c = inMonth.find((x) => x.date === iso);
            const active = iso === selected;
            const weekday = d.toLocaleDateString(locale(lang), { weekday: 'short' }).replace('.', '');
            const inner = (
              <>
                <span className={cn('text-[0.68rem] uppercase', active ? 'opacity-80' : 'text-muted')}>{weekday}</span>
                <span className="font-serif text-xl font-semibold tabular">{d.getDate()}</span>
                <span aria-hidden className={cn('mt-0.5 h-1.5 w-1.5 rounded-full', c ? (active ? 'bg-gold' : 'bg-accent') : 'bg-transparent')} />
              </>
            );
            return (
              <li key={iso} className="snap-start" data-day={iso}>
                {c ? (
                  <button
                    type="button"
                    onClick={() => goTo(iso)}
                    aria-pressed={active}
                    aria-label={`${formatDate(iso, lang)}: ${pick(lang, c.titleNl, c.titleEn)}`}
                    className={cn(
                      'flex h-[4.75rem] w-14 flex-col items-center justify-center rounded-full border transition-colors duration-200',
                      active ? 'border-primary bg-primary text-primary-fg shadow-lift' : 'border-line/70 bg-bg hover:border-fg/30',
                    )}
                  >
                    {inner}
                  </button>
                ) : (
                  <span aria-hidden className={cn('flex h-[4.75rem] w-12 flex-col items-center justify-center rounded-full', iso === todayIso ? 'border border-dashed border-fg/30' : 'opacity-45')}>
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div role="group" aria-label={t('cat.filter')} className="scroll-x mt-5 border-t border-line/70 pt-4 sm:mx-0 sm:px-0">
          <button type="button" className="chip" aria-pressed={filter === null} onClick={() => setFilter(null)}>
            {t('cat.all')}
          </button>
          {parts.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={filter === p} onClick={() => setFilter(filter === p ? null : p)}>
              <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', p === 'intro' ? 'bg-gold' : tint[p].card)} />
              {p === 'intro' ? t('cat.part.intro') : <span lang="la">{t(`cat.part.${p}`)}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Agenda: date gutter + tinted cards */}
      <ol className="space-y-3">
        {shown.map((c, i) => {
          const d = at(c.date);
          const newMonth = i === 0 || shown[i - 1]!.date.slice(0, 7) !== c.date.slice(0, 7);
          const tn = tint[c.part];
          return (
            <li key={c.date}>
              {newMonth && <p className={cn('mb-3 font-display text-xs font-semibold uppercase tracking-caps text-muted', i > 0 && 'mt-8')}>{monthLabel(c.date.slice(0, 7), lang)}</p>}
              <div id={c.date} className="grid scroll-mt-32 grid-cols-[3.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[4rem_minmax(0,1fr)]">
                <div className="pt-4 text-center">
                  <span className="block font-serif text-2xl font-semibold leading-none tabular">{d.getDate()}</span>
                  <span className="mt-1 block text-[0.68rem] uppercase text-muted">{d.toLocaleDateString(locale(lang), { weekday: 'short' }).replace('.', '')}</span>
                </div>
                <article
                  className={cn('rounded-lg p-4 transition-shadow sm:p-5', tn.card, c.date === selected && 'shadow-lift ring-2 ring-primary/80')}
                  aria-current={c.date === selected ? 'date' : undefined}
                >
                  <p className={cn('font-display text-[0.65rem] font-semibold uppercase tracking-caps', tn.fg)}>
                    {c.part === 'intro' ? t('cat.part.intro') : <span lang="la">{t(`cat.part.${c.part}`)}</span>}
                    {c.number > 0 && ` · ${c.number}`}
                  </p>
                  <h3 className="mt-1 font-serif text-lg font-semibold leading-snug">{pick(lang, c.titleNl, c.titleEn)}</h3>
                  {lang === 'nl' && (
                    <p className="mt-0.5 text-xs text-fg/70">
                      {t('cat.official')}: <span lang="en">{c.titleEn}</span>
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-primary px-4 text-xs font-semibold text-primary-fg hover:bg-primary/90"
                    >
                      {t('cat.read')} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                    {c.videoId && (
                      <Link to="/videos" className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-card/80 px-3 text-xs font-medium hover:bg-card">
                        <PlayCircle className="h-3.5 w-3.5" aria-hidden /> {t('video.title')}
                      </Link>
                    )}
                    {c.paragraphs && c.paragraphs.length > 0 && (
                      <span className="text-xs text-fg/75">
                        {t('cat.related')}:{' '}
                        {c.paragraphs.map((p, j) => (
                          <span key={p}>
                            {j > 0 && ', '}
                            <CiteLink id={p} />
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </article>
              </div>
            </li>
          );
        })}
      </ol>

      <Commentary className="mt-12">
        <p>
          {lang === 'nl'
            ? 'De koppeling van catecheses aan paragrafen is redactioneel: zij wijst aan welke excerpten in deze app bij het onderwerp horen, niet welke paragrafen de paus letterlijk citeert.'
            : 'The link between catecheses and paragraphs is editorial: it shows which excerpts in this app belong to the topic, not which paragraphs the pope literally quotes.'}
        </p>
      </Commentary>
    </div>
  );
}
