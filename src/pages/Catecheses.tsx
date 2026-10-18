import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { CiteLink, Commentary, Loading, PageHeader } from '@/components/TextBlocks';
import { SegmentedTabs, panelId, tabId } from '@/components/ui/tabs';
import { getCatecheses } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { cn, formatDate, pick } from '@/lib/utils';
import type { Catechesis } from '@/types/content';

type Filter = 'all' | Catechesis['part'];
const parts: Catechesis['part'][] = ['intro', 'DV', 'LG', 'SC', 'GS'];

const locale = (lang: 'nl' | 'en') => (lang === 'nl' ? 'nl-NL' : 'en-GB');
const at = (iso: string) => new Date(`${iso}T12:00:00`);

/**
 * Register of the general-audience catecheses, newest first and grouped by month,
 * in the manner of the audience index on vatican.va.
 */
export function Catecheses() {
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const { data: series, loading } = useAsync(getCatecheses, []);
  useDocumentTitle(t('cat.title'));
  const [filter, setFilter] = useState<Filter>('all');
  const hash = decodeURIComponent(location.hash.slice(1));

  const items = useMemo(() => (series ? [...series.items].sort((a, b) => b.date.localeCompare(a.date)) : []), [series]);

  useEffect(() => {
    if (!hash || !items.length) return;
    setFilter('all');
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'center' }));
  }, [hash, items.length]);

  if (loading || !series) return <Loading />;

  const shown = filter === 'all' ? items : items.filter((c) => c.part === filter);
  const label = (p: Catechesis['part']) => (p === 'intro' ? t('cat.part.intro') : t(`cat.part.${p}`));
  const tabs = [
    { id: 'all' as const, label: t('cat.all'), count: items.length },
    ...parts.map((p) => ({ id: p, label: p === 'intro' ? t('cat.part.intro') : p, count: items.filter((c) => c.part === p).length })),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Leo PP. XIV · Audientiae generales · MMXXVI" title={pick(lang, series.seriesTitleNl, series.seriesTitleEn)} intro={pick(lang, series.introNl, series.introEn)}>
        <p className="mt-3 text-xs text-muted">
          {t('cat.count', { count: series.items.length })} · {t('cat.checked', { date: formatDate(series.checkedOn, lang) })}
        </p>
      </PageHeader>

      <SegmentedTabs items={tabs} value={filter} onChange={setFilter} label={t('cat.filter')} prefix="cat" />

      <div role="tabpanel" id={panelId('cat', filter)} aria-labelledby={tabId('cat', filter)}>
        {shown.map((c, i) => {
          const d = at(c.date);
          const newMonth = i === 0 || shown[i - 1]!.date.slice(0, 7) !== c.date.slice(0, 7);
          return (
            <div key={c.date}>
              {newMonth && (
                <h2 className="mt-10 border-b border-fg/70 pb-1.5 font-title text-[1.35rem] font-medium capitalize">
                  {d.toLocaleDateString(locale(lang), { month: 'long', year: 'numeric' })}
                </h2>
              )}
              <article
                id={c.date}
                className={cn('grid scroll-mt-24 grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-b border-line py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)]', hash === c.date && 'bg-surface')}
              >
                <div className="pl-1 pt-0.5">
                  <span className="block font-title text-[2rem] font-medium leading-none tabular">{d.getDate()}</span>
                  <span className="mt-1 block text-xs text-muted small-caps">{d.toLocaleDateString(locale(lang), { weekday: 'long' })}</span>
                </div>
                <div className="min-w-0">
                  <p className="rubric-label">
                    <span lang={c.part === 'intro' ? undefined : 'la'}>{label(c.part)}</span>
                    {c.number > 0 && ` · ${c.number}`}
                  </p>
                  <h3 className="mt-1 font-title text-[1.35rem] font-medium leading-snug">{pick(lang, c.titleNl, c.titleEn)}</h3>
                  {lang === 'nl' && (
                    <p className="mt-0.5 text-sm text-muted">
                      {t('cat.official')}: <span lang="en">{c.titleEn}</span>
                    </p>
                  )}
                  <p className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                      {t('cat.read')} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                    {c.videoId && (
                      <Link to="/videos" className="inline-flex items-center gap-1 text-accent hover:underline">
                        <PlayCircle className="h-3.5 w-3.5" aria-hidden /> {t('video.title')}
                      </Link>
                    )}
                    {c.paragraphs && c.paragraphs.length > 0 && (
                      <span className="text-muted">
                        {t('cat.related')}:{' '}
                        {c.paragraphs.map((p, j) => (
                          <span key={p}>
                            {j > 0 && ', '}
                            <CiteLink id={p} />
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              </article>
            </div>
          );
        })}
      </div>

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
