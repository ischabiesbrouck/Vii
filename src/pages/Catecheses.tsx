import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { CiteLink, Commentary, Loading, PageHeader, SectionTitle } from '@/components/TextBlocks';
import { getCatecheses, getDocuments } from '@/lib/content';
import { useAsync } from '@/lib/useAsync';
import { useDocumentTitle, useLang } from '@/lib/hooks';
import { formatDate, pick } from '@/lib/utils';
import type { Catechesis } from '@/types/content';

const parts: Catechesis['part'][] = ['intro', 'DV', 'LG', 'SC', 'GS'];

export function Catecheses() {
  const { t } = useTranslation();
  const lang = useLang();
  const location = useLocation();
  const { data, loading } = useAsync(() => Promise.all([getCatecheses(), getDocuments()]), []);
  useDocumentTitle(t('cat.title'));

  useEffect(() => {
    if (!location.hash || !data) return;
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'center' });
  }, [location.hash, data]);

  if (loading || !data) return <Loading />;
  const [series, docs] = data;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Leo PP. XIV · MMXXVI" title={pick(lang, series.seriesTitleNl, series.seriesTitleEn)} intro={pick(lang, series.introNl, series.introEn)}>
        <p className="mt-3 text-xs text-muted">
          {t('cat.count', { count: series.items.length })} · {t('cat.checked', { date: formatDate(series.checkedOn, lang) })}
        </p>
      </PageHeader>

      <div className="space-y-12">
        {parts.map((part) => {
          const items = series.items.filter((c) => c.part === part);
          if (!items.length) return null;
          const doc = docs.find((d) => d.id === items[0]?.docId);
          return (
            <section key={part} aria-labelledby={`h-${part}`}>
              <SectionTitle
                id={`h-${part}`}
                action={
                  doc && (
                    <Link to={`/documents/${doc.id}`} className="text-sm text-accent hover:underline">
                      {doc.abbr} →
                    </Link>
                  )
                }
              >
                {part === 'intro' ? t('cat.part.intro') : <span lang="la">{t(`cat.part.${part}`)}</span>}
              </SectionTitle>
              <ol className="relative space-y-6 border-l border-gold/60 pl-6">
                {items.map((c) => (
                  <li key={c.date} id={c.date} className="relative scroll-mt-32">
                    <span className="absolute -left-[calc(1.5rem+6.5px)] top-1.5 h-3 w-3 rotate-45 border-2 border-bg bg-accent" aria-hidden />
                    <p className="text-xs font-semibold tabular text-gold-text">
                      {formatDate(c.date, lang)}
                      {c.number > 0 && ` · ${c.number}`}
                    </p>
                    <h3 className="mt-0.5 font-serif text-lg font-semibold leading-snug">{pick(lang, c.titleNl, c.titleEn)}</h3>
                    {lang === 'nl' && (
                      <p className="mt-0.5 text-xs text-muted">
                        {t('cat.official')}: <span lang="en">{c.titleEn}</span>
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
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
                          {c.paragraphs.map((p, i) => (
                            <span key={p}>
                              {i > 0 && ', '}
                              <CiteLink id={p} />
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
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
